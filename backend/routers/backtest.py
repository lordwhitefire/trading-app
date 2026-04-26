from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.engine.backtest_runner import run_backtest

router = APIRouter()

@router.post("/api/backtest/")
async def backtest_strategy(strategy: Strategy):
    try:
        result = run_backtest(strategy)
        return result.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))