from fastapi import APIRouter

router = APIRouter()

@router.get("/api/indicators")
async def get_indicators():
    from backend.engine.indicator_engine import get_available_indicators
    return {"indicators": get_available_indicators()}
