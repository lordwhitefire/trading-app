from fastapi import APIRouter
from backend.engine.data_fetcher import fetch_etf_data

router = APIRouter()

@router.get("/etf")
async def etf():
    data = fetch_etf_data()
    if data is None:
        return {"error": "Failed to fetch ETF data"}
    return {"data": data}
