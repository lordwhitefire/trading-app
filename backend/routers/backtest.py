from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.engine.backtest_runner import run_backtest

router = APIRouter(prefix="/api/backtest")

@router.post("/")
async def backtest_strategy(strategy: Strategy):
    try:
        result = run_backtest(strategy)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
