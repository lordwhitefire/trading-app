from fastapi import APIRouter
from backend.engine.backtest_runner import run_backtest
from backend.models.strategy import Strategy

router = APIRouter()

@router.post("/backtest/")
async def backtest(strategy: Strategy):
    return run_backtest(strategy)
