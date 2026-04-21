from fastapi import APIRouter
from backend.engine.data_fetcher import fetch_live_price

router = APIRouter()

@router.get("/live/{coin}")
async def live(coin: str):
    price = fetch_live_price(coin)
    if price is None:
        return {"error": "Failed to fetch live price"}
    return {"price": price}
