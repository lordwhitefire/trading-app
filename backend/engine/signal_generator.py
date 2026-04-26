from datetime import datetime
from backend.models.strategy import Strategy
from backend.models.signal import LiveSignal
from backend.engine.data_fetcher import fetch_ohlcv
from backend.engine.condition_evaluator import evaluate_all_conditions
from backend.utils.candle_calculator import calculate_liquidation_price
from backend.engine.backtest_runner import _detect_direction


def generate_live_signal(strategy: Strategy):
    """
    Checks the latest candle for a signal.
    Returns a LiveSignal if conditions are met, otherwise None.
    """
    fetch_result = fetch_ohlcv(strategy)
    df = fetch_result["df"]

    if df.empty:
        return None

    signal_series = evaluate_all_conditions(df, strategy)

    last_index = len(df) - 2
    if last_index < 0:
        return None

    if not signal_series.iloc[last_index]:
        return None

    entry_price = float(df['open'].iloc[-1])
    direction = _detect_direction(strategy, df, last_index)
    liq_price = calculate_liquidation_price(
        entry_price,
        strategy.analysis_config.leverage,
        direction
    )

    conditions_triggered = [
        f"{c.type}:{getattr(c, 'indicator', getattr(c, 'pattern', getattr(c, 'level_type', 'confirmation')))}"
        for c in strategy.conditions
    ]

    return LiveSignal(
        coin=strategy.coin,
        timeframe=strategy.timeframe,
        direction=direction,
        entry_price=entry_price,
        liquidation_price=liq_price,
        time=str(datetime.utcnow()),
        conditions_triggered=conditions_triggered,
        confidence=75.0,
    )