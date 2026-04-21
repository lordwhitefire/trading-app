from pydantic import BaseModel

class Strategy(BaseModel):
    coin: str
    timeframe: str
    backtest_period: int
    trade_duration: int
    stop_loss: float
    conditions: list
    logic: str
