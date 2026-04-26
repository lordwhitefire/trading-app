from fastapi import APIRouter, HTTPException
from backend.engine.data_fetcher import fetch_etf_data

router = APIRouter()

@router.get("/api/etf/")
async def get_etf_data():
    try:
        data = fetch_etf_data()
        return {"etf": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))