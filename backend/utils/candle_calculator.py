from backend.models.strategy import Strategy


TIMEFRAME_TO_MINUTES = {
    '1m': 1, '5m': 5, '15m': 15,
    '1h': 60, '4h': 240, '1d': 1440,
}


def calculate_candles_needed(strategy: Strategy) -> dict:
    warmup = strategy.get_max_lookback()
    backtest = strategy.backtest_period
    total = backtest + warmup
    tf_minutes = TIMEFRAME_TO_MINUTES.get(strategy.timeframe, 60)

    return {
        "backtest_candles": backtest,
        "warmup_candles": warmup,
        "total_candles": total,
        "timeframe_minutes": tf_minutes,
        "total_duration_days": round((total * tf_minutes) / (60 * 24), 1)
    }


def calculate_liquidation_price(
    entry_price: float,
    leverage: float,
    direction: str
) -> float:
    if direction == "long":
        return round(entry_price * (1 - 1 / leverage), 4)
    else:
        return round(entry_price * (1 + 1 / leverage), 4)


def calculate_stop_loss_price(
    entry_price: float,
    stop_loss_pct: float,
    direction: str
) -> float:
    if direction == "long":
        return round(entry_price * (1 - stop_loss_pct / 100), 4)
    else:
        return round(entry_price * (1 + stop_loss_pct / 100), 4)


def calculate_take_profit_price(
    entry_price: float,
    take_profit_pct: float,
    direction: str
) -> float:
    if direction == "long":
        return round(entry_price * (1 + take_profit_pct / 100), 4)
    else:
        return round(entry_price * (1 - take_profit_pct / 100), 4)


def calculate_pnl(
    entry_price: float,
    exit_price: float,
    direction: str,
    leverage: float,
    amount: float
) -> dict:
    if direction == "long":
        pnl_pct = ((exit_price - entry_price) / entry_price) * leverage * 100
    else:
        pnl_pct = ((entry_price - exit_price) / entry_price) * leverage * 100

    pnl_usd = (pnl_pct / 100) * amount

    return {
        "pnl_pct": round(pnl_pct, 4),
        "pnl_usd": round(pnl_usd, 4)
    }


def get_max_safe_stop_loss(leverage: float) -> float:
    """
    Returns the maximum stop loss percentage that is safely
    above the liquidation level for a given leverage.
    """
    liquidation_pct = 100.0 / leverage
    return round(liquidation_pct - 0.1, 2)