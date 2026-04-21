from backend.models.signal import Signal

def generate_signal(timestamp, entry_price, exit_price, pnl, outcome):
    return Signal(
        timestamp=timestamp,
        entry_price=entry_price,
        exit_price=exit_price,
        pnl=pnl,
        outcome=outcome
    )
