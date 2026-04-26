import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from backend.models.strategy import Strategy
from backend.utils.candle_calculator import calculate_candles_needed

SOSOVALUE_API_KEY = os.getenv('SOSOVALUE_API_KEY')
BYBIT_BASE_URL = "https://api.bybit.com"
SOSOVALUE_BASE_URL = "https://openapi.sosovalue.com"

TIMEFRAME_MAP = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
}

TIMEFRAME_MINUTES = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
}


def fetch_ohlcv(strategy: Strategy) -> dict:
    """
    Fetches exactly the right number of candles based on the strategy.
    Returns a dict with the full DataFrame and metadata about warmup split.
    """
    candle_info = calculate_candles_needed(strategy)
    total_candles = candle_info["total_candles"]
    warmup_candles = candle_info["warmup_candles"]
    tf_minutes = candle_info["timeframe_minutes"]

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
        raise Exception("No candle data returned from Bybit")

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

    # Trim to exactly what we need
    if len(df) > total_candles:
        df = df.iloc[-total_candles:].reset_index(drop=True)

    return {
        "df": df,
        "warmup_candles": warmup_candles,
        "backtest_candles": candle_info["backtest_candles"],
        "total_candles": len(df),
        "analysis_start_index": warmup_candles,
    }


def fetch_live_price(coin: str) -> float:
    symbol = coin.replace('/', '')
    try:
        response = requests.get(
            f"{BYBIT_BASE_URL}/v5/market/tickers",
            params={'category': 'spot', 'symbol': symbol},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return float(data['result']['list'][0]['lastPrice'])
    except Exception as e:
        raise Exception(f"Failed to fetch live price: {e}")


def fetch_news(coin: str) -> list:
    try:
        headers = {'x-soso-api-key': SOSOVALUE_API_KEY}
        response = requests.post(
            f"{SOSOVALUE_BASE_URL}/openapi/v1/news/currency",
            headers=headers,
            json={'currencyName': coin.split('/')[0].lower()},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get('data', [])
    except Exception as e:
        raise Exception(f"Failed to fetch news: {e}")


def fetch_etf_data() -> dict:
    try:
        headers = {'x-soso-api-key': SOSOVALUE_API_KEY}
        response = requests.post(
            f"{SOSOVALUE_BASE_URL}/openapi/v1/etf/metrics",
            headers=headers,
            json={},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return data.get('data', {})
    except Exception as e:
        raise Exception(f"Failed to fetch ETF data: {e}")