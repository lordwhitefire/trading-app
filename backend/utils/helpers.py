from datetime import datetime
from backend.models.signal import Signal

def format_date(date):
    return date.strftime("%Y-%m-%d")

def calculate_pnl(entry_price, exit_price):
    pnl = (exit_price - entry_price) / entry_price * 100
    return pnl

def serialize_signals(signals):
    return [signal.dict() for signal in signals]
