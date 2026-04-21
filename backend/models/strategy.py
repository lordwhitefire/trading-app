from pydantic import BaseModel
from typing import List, Optional

class Condition(BaseModel):
    indicator: str
    operator: str
    value: float
    period: Optional[int] = None

class Strategy(BaseModel):
    name: str
    coin: str
    timeframe: str
    backtest_period: int
    trade_duration: int
    stop_loss: float
    conditions: List[Condition]
    logic: str
