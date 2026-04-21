from fastapi import APIRouter
from backend.engine.data_fetcher import fetch_news

router = APIRouter()

@router.get("/news/{coin}")
async def news(coin: str):
    articles = fetch_news(coin)
    if articles is None:
        return {"error": "Failed to fetch news"}
    return {"articles": articles}
