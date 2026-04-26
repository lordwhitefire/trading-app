from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.engine.signal_generator import generate_live_signal

router = APIRouter()

@router.post("/api/live/")
async def get_live_signal(strategy: Strategy):
    try:
        signal = generate_live_signal(strategy)
        if signal:
            return signal.dict()
        return {"signal": None, "message": "No signal on current candle"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))