from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.engine.signal_generator import generate_live_signal

router = APIRouter(prefix="/api/live")

@router.post("/")
async def get_live_signal(strategy: Strategy):
    try:
        from backend.engine.data_fetcher import fetch_ohlcv
        from datetime import datetime, timedelta
        
        df = fetch_ohlcv(strategy.coin, strategy.timeframe, datetime.now() - timedelta(days=1), datetime.now())
        signal = generate_live_signal(strategy, df)
        return signal
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
