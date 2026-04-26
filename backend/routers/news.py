from fastapi import APIRouter, HTTPException
from backend.engine.data_fetcher import fetch_news

router = APIRouter()

@router.get("/api/news/{coin}")
async def get_news(coin: str):
    try:
        news = fetch_news(coin)
        return {"news": news}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))