from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/news")

@router.get("/{coin}")
async def get_news(coin: str):
    try:
        from backend.engine.data_fetcher import fetch_news
        news = fetch_news(coin)
        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
