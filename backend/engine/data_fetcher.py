import os
import time
import hmac
import hashlib
import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
from backend.models.strategy import Strategy
from backend.utils.candle_calculator import calculate_candles_needed

SOSOVALUE_API_KEY = os.getenv('SOSOVALUE_API_KEY')
BYBIT_API_KEY = os.getenv('BYBIT_API_KEY', '')
BYBIT_API_SECRET = os.getenv('BYBIT_API_SECRET', '')
BYBIT_BASE_URL = "https://api.bybit.com"
SOSOVALUE_BASE_URL = "https://openapi.sosovalue.com"

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

TIMEFRAME_MAP = {
    '1m': '1', '5m': '5', '15m': '15',
    '1h': '60', '4h': '240', '1d': 'D',
}

TIMEFRAME_MINUTES = {
    '1m': 1, '5m': 5, '15m': 15,
    '1h': 60, '4h': 240, '1d': 1440,
}


def _bybit_headers(params: dict) -> dict:
    if not BYBIT_API_KEY or not BYBIT_API_SECRET:
        return {}
    timestamp = str(int(time.time() * 1000))
    recv_window = "20000"
    query_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
    sign_str = f"{timestamp}{BYBIT_API_KEY}{recv_window}{query_string}"
    signature = hmac.new(
        BYBIT_API_SECRET.encode('utf-8'),
        sign_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': recv_window,
    }


def _get_device_ohlcv(coin: str, timeframe: str) -> dict | None:
    """
    Check Supabase device_data for candles sent by the phone.
    Returns the data if it exists and is less than 5 minutes old.
    """
    try:
        key = f"ohlcv_{coin.replace('/', '')}_{timeframe}"
        result = supabase.table("device_data").select("*").eq("key", key).execute()
        if not result.data:
            return None
        row = result.data[0]
        updated_at = datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00"))
        age_seconds = (datetime.now(timezone.utc) - updated_at).total_seconds()
        if age_seconds > 300:  # 5 minutes
            return None
        return row["value"]
    except Exception:
        return None


def fetch_ohlcv(strategy: Strategy) -> dict:
    candle_info = calculate_candles_needed(strategy)
    total_candles = candle_info["total_candles"]
    warmup_candles = candle_info["warmup_candles"]
    tf_minutes = candle_info["timeframe_minutes"]

    # ── Check device data first ──────────────────────────────────────────────
    device_data = _get_device_ohlcv(strategy.coin, strategy.timeframe)
    if device_data and device_data.get("candles"):
        candles = device_data["candles"]
        df = pd.DataFrame(
            candles,
            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
        )
        df['timestamp'] = pd.to_datetime(df['timestamp'].astype(float), unit='ms')
        df[['open', 'high', 'low', 'close', 'volume']] = df[
            ['open', 'high', 'low', 'close', 'volume']
        ].astype(float)
        df = df.sort_values('timestamp').reset_index(drop=True)
        if len(df) > total_candles:
            df = df.iloc[-total_candles:].reset_index(drop=True)
        return {
            "df": df,
            "warmup_candles": warmup_candles,
            "backtest_candles": candle_info["backtest_candles"],
            "total_candles": len(df),
            "analysis_start_index": warmup_candles,
            "source": "device",
        }

    # ── Fallback: call Bybit directly ────────────────────────────────────────
    symbol = strategy.coin.replace('/', '')
    interval = TIMEFRAME_MAP.get(strategy.timeframe, '60')

    end_dt = datetime.utcnow()
    start_dt = end_dt - timedelta(minutes=total_candles * tf_minutes)

    start_ms = int(start_dt.timestamp() * 1000)
    end_ms = int(end_dt.timestamp() * 1000)

    all_candles = []
    current_end = end_ms

    while len(all_candles) < total_candles:
        params = {
            'category': 'spot',
            'symbol': symbol,
            'interval': interval,
            'start': start_ms,
            'end': current_end,
            'limit': 1000,
        }
        try:
            response = requests.get(
                f"{BYBIT_BASE_URL}/v5/market/kline",
                params=params,
                headers=_bybit_headers(params),
                timeout=15
            )
            response.raise_for_status()
            data = response.json()

            if data['retCode'] != 0:
                raise Exception(f"Bybit API error: {data['retMsg']}")

            candles = data['result']['list']
            if not candles:
                break

            all_candles.extend(candles)
            earliest_ts = int(candles[-1][0])
            if earliest_ts <= start_ms:
                break
            current_end = earliest_ts - 1

        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch OHLCV data: {e}")

    if not all_candles:
        raise Exception("No candle data returned. Device has not sent data yet and Bybit is unreachable from this server.")

    df = pd.DataFrame(
        all_candles,
        columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'turnover']
    )
    df = df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
    df['timestamp'] = pd.to_datetime(df['timestamp'].astype(float), unit='ms')
    df[['open', 'high', 'low', 'close', 'volume']] = df[
        ['open', 'high', 'low', 'close', 'volume']
    ].astype(float)
    df = df.sort_values('timestamp').reset_index(drop=True)

    if len(df) > total_candles:
        df = df.iloc[-total_candles:].reset_index(drop=True)

    return {
        "df": df,
        "warmup_candles": warmup_candles,
        "backtest_candles": candle_info["backtest_candles"],
        "total_candles": len(df),
        "analysis_start_index": warmup_candles,
        "source": "bybit_direct",
    }


def fetch_live_price(coin: str) -> float:
    symbol = coin.replace('/', '')
    params = {'category': 'spot', 'symbol': symbol}
    try:
        response = requests.get(
            f"{BYBIT_BASE_URL}/v5/market/tickers",
            params=params,
            headers=_bybit_headers(params),
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return float(data['result']['list'][0]['lastPrice'])
    except Exception as e:
        raise Exception(f"Failed to fetch live price: {e}")


def fetch_news(coin: str) -> list:
    try:
        symbol = coin.split('/')[0].upper()
        response = requests.get(
            "https://min-api.cryptocompare.com/data/v2/news/",
            params={
                'categories': symbol,
                'excludeCategories': 'Sponsored',
                'lang': 'EN',
                'sortOrder': 'latest',
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        articles = data.get('Data', [])[:10]

        return [
            {
                'title': a.get('title', ''),
                'source': a.get('source_info', {}).get('name', 'Unknown'),
                'url': a.get('url', ''),
                'published_at': a.get('published_on', 0),
                'sentiment': _classify_sentiment(a.get('title', '')),
            }
            for a in articles
        ]
    except Exception as e:
        raise Exception(f"Failed to fetch news: {e}")


def _classify_sentiment(title: str) -> str:
    title_lower = title.lower()
    bullish_words = ['surge', 'rally', 'bull', 'gain', 'rise', 'high', 'approve', 'launch', 'adoption', 'buy']
    bearish_words = ['crash', 'drop', 'fall', 'bear', 'sell', 'hack', 'ban', 'fear', 'decline', 'loss']
    if any(w in title_lower for w in bullish_words):
        return 'BULLISH'
    if any(w in title_lower for w in bearish_words):
        return 'BEARISH'
    return 'NEUTRAL'


def fetch_etf_data() -> list:
    try:
        headers = {'x-soso-api-key': SOSOVALUE_API_KEY}
        response = requests.post(
            f"{SOSOVALUE_BASE_URL}/openapi/v1/etf/spot/bitcoin/list",
            headers=headers,
            json={},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        items = data.get('data', [])

        return [
            {
                'ticker': item.get('ticker', ''),
                'netFlow': item.get('dailyNetInflow', 0),
                'totalAum': f"${item.get('totalNetAssets', 0) / 1e9:.1f}B",
            }
            for item in items[:8]
        ]
    except Exception:
        return []