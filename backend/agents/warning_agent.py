from backend.models.strategy import Strategy


def review_strategy(strategy: Strategy) -> list:
    """
    Reviews a compiled strategy and returns a list of warnings.
    Each warning has a severity (info, warning, danger) and a message.
    """
    warnings = []
    cfg = strategy.analysis_config
    leverage = cfg.leverage
    trade_duration = cfg.trade_duration

    # ── Leverage warnings ─────────────────────────────────────────────────────
    if leverage >= 50:
        warnings.append({
            "severity": "danger",
            "field": "leverage",
            "message": f"Leverage of {leverage}x is extremely high. "
                       f"A price move of {round(100/leverage, 1)}% will liquidate your position."
        })
    elif leverage >= 20:
        warnings.append({
            "severity": "warning",
            "field": "leverage",
            "message": f"Leverage of {leverage}x is aggressive. "
                       f"A {round(100/leverage, 1)}% move against you causes liquidation."
        })

    # ── Trade duration warnings ───────────────────────────────────────────────
    if trade_duration <= 1:
        warnings.append({
            "severity": "warning",
            "field": "trade_duration",
            "message": "Trade duration of 1 candle is very short. "
                       "Most signals need time to play out."
        })
    elif trade_duration > 500:
        warnings.append({
            "severity": "warning",
            "field": "trade_duration",
            "message": f"Trade duration of {trade_duration} candles is very long. "
                       f"Consider a shorter holding period."
        })

    # ── Condition count warnings ──────────────────────────────────────────────
    if len(strategy.conditions) > 6:
        warnings.append({
            "severity": "warning",
            "field": "conditions",
            "message": "More than 6 conditions may produce very few or no signals. "
                       "Consider simplifying your strategy."
        })

    # ── Conflicting conditions ────────────────────────────────────────────────
    indicator_conditions = [c for c in strategy.conditions if c.type == "indicator"]
    rsi_conditions = [c for c in indicator_conditions if c.indicator.lower() == "rsi"]

    if len(rsi_conditions) >= 2:
        ops = [c.operator for c in rsi_conditions]
        if "less_than" in ops and "greater_than" in ops:
            warnings.append({
                "severity": "danger",
                "field": "conditions",
                "message": "Conflicting RSI conditions detected — "
                           "RSI cannot be simultaneously above and below a value."
            })

    # ── Short period warnings ─────────────────────────────────────────────────
    for c in indicator_conditions:
        if c.period and c.period < 5:
            warnings.append({
                "severity": "info",
                "field": "conditions",
                "message": f"{c.indicator.upper()} period of {c.period} is very short "
                           f"and may produce noisy signals. Consider using at least 5."
            })

    # ── Level condition with too few touches ──────────────────────────────────
    level_conditions = [c for c in strategy.conditions if c.type == "level"]
    for c in level_conditions:
        if c.min_touches < 2:
            warnings.append({
                "severity": "info",
                "field": "conditions",
                "message": f"S/R level with only {c.min_touches} touch may not be reliable. "
                           f"Consider requiring at least 2 touches."
            })

    # ── Backtest period too short ─────────────────────────────────────────────
    if strategy.backtest_period < 50:
        warnings.append({
            "severity": "warning",
            "field": "backtest_period",
            "message": f"Backtest period of {strategy.backtest_period} candles is short. "
                       f"Results may not be statistically significant."
        })

    # ── No signals likely with AND logic and many conditions ─────────────────
    if strategy.logic == "AND" and len(strategy.conditions) >= 4:
        warnings.append({
            "severity": "info",
            "field": "logic",
            "message": "Using AND logic with 4 or more conditions may produce very few signals. "
                       "Consider switching to OR or reducing conditions."
        })

    if not warnings:
        warnings.append({
            "severity": "info",
            "field": "general",
            "message": "Strategy looks good. No major issues detected."
        })

    return warnings