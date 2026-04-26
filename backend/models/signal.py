from pydantic import BaseModel
from typing import List, Optional, Literal


class Signal(BaseModel):
    date: str
    coin: str
    timeframe: str
    direction: str
    entry_price: float
    exit_price: Optional[float] = None
    stop_loss_price: float
    take_profit_price: float
    outcome: Literal["win", "loss", "expired-win", "expired-loss"]
    duration_candles: int
    pnl_pct: float
    pnl_usd: float
    conditions_met: List[str]


class BacktestResult(BaseModel):
    strategy_name: str
    coin: str
    timeframe: str
    backtest_period: int
    total_candles_fetched: int
    warmup_candles: int
    total_signals: int
    wins: int
    losses: int
    expired_wins: int
    expired_losses: int
    win_rate: float
    total_return_pct: float
    total_return_usd: float
    avg_pnl_pct: float
    max_drawdown_pct: float
    signals: List[Signal]


class LiveSignal(BaseModel):
    coin: str
    timeframe: str
    direction: str
    entry_price: float
    stop_loss_price: float
    take_profit_price: float
    time: str
    conditions_triggered: List[str]
    confidence: float