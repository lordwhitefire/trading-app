from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

@router.get("/api/coins")
async def get_available_coins():
    try:
        response = requests.get(
            "https://api.bybit.com/v5/market/instruments-info",
            params={"category": "spot"},
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