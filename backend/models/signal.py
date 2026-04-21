from pydantic import BaseModel
from typing import List

class Signal(BaseModel):
    date: str
    coin: str
    price: float
    conditions_met: List[str]
    outcome: str
    duration: int
    pnl: float

class LiveSignal(BaseModel):
    coin: str
    price: float
    time: str
    conditions_triggered: List[str]
    confidence_score: float
