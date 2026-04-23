from fastapi import APIRouter
from backend.engine.indicator_engine import get_available_indicators

router = APIRouter()

@router.get("/api/indicators")
async def get_indicators():
    return {"indicators": get_available_indicators()}