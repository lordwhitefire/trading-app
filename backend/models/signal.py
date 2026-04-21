from pydantic import BaseModel
from datetime import datetime

class Signal(BaseModel):
    timestamp: datetime.datetime
    entry_price: float
    exit_price: float
    pnl: float
    outcome: str
