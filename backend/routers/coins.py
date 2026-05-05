from fastapi import APIRouter, HTTPException
import requests
import os
import time
import hmac
import hashlib

router = APIRouter()

BYBIT_API_KEY = os.getenv('BYBIT_API_KEY', '')
BYBIT_API_SECRET = os.getenv('BYBIT_API_SECRET', '')

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

@router.get("/api/coins")
async def get_available_coins():
    try:
        params = {"category": "spot"}
        response = requests.get(
            "https://api.bybit.com/v5/market/instruments-info",
            params=params,
            headers=_bybit_headers(params),
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        if data['retCode'] != 0:
            raise Exception(data['retMsg'])
        symbols = [
            item['symbol']
            for item in data['result']['list']
            if item['status'] == 'Trading' and item['symbol'].endswith('USDT')
        ]
        symbols.sort()
        return {"coins": symbols}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
