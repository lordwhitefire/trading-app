from fastapi import APIRouter
from backend.engine.pattern_engine import get_available_patterns

router = APIRouter()

@router.get("/api/patterns")
async def get_patterns():
    return {"patterns": get_available_patterns()}