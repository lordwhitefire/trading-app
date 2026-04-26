import pandas as pd
from backend.models.strategy import Strategy, IndicatorCondition
from backend.engine.indicator_engine import calculate_indicators
from backend.engine.pattern_engine import detect_patterns
from backend.engine.levels_engine import calculate_levels, evaluate_level_conditions


def evaluate_all_conditions(df: pd.DataFrame, strategy: Strategy) -> pd.Series:
    """
    Master evaluator — runs all four condition categories and combines
    them using the strategy's AND/OR logic.
    Returns a boolean Series where True = signal on that candle.
    """
    results = []

    # ── Category 1: Indicators ────────────────────────────────────────────────
    indicator_conditions = [c for c in strategy.conditions if c.type == "indicator"]
    if indicator_conditions:
        df = calculate_indicators(df, indicator_conditions)
        for condition in indicator_conditions:
            series = _evaluate_indicator(df, condition)
            if series is not None:
                results.append(series)

    # ── Category 2: Patterns ──────────────────────────────────────────────────
    pattern_conditions = [c for c in strategy.conditions if c.type == "pattern"]
    if pattern_conditions:
        df = detect_patterns(df, pattern_conditions)
        for condition in pattern_conditions:
            col_key = f"pattern_{condition.pattern.lower()}"
            if col_key in df.columns:
                results.append(df[col_key].astype(bool))

    # ── Category 3: Levels ────────────────────────────────────────────────────
    level_conditions = [c for c in strategy.conditions if c.type == "level"]
    if level_conditions:
        levels = calculate_levels(df, level_conditions)
        level_series = evaluate_level_conditions(df, level_conditions, levels)
        results.append(level_series)

    # ── Category 4: Confirmation ──────────────────────────────────────────────
    confirmation_conditions = [c for c in strategy.conditions if c.type == "confirmation"]
    if confirmation_conditions:
        from backend.engine.confirmation_engine import evaluate_confirmations
        conf_series = evaluate_confirmations(df, confirmation_conditions)
        results.append(conf_series)

    # ── Combine all results ───────────────────────────────────────────────────
    if not results:
        return pd.Series(False, index=df.index)

    if strategy.logic == "AND":
        combined = results[0]
        for r in results[1:]:
            combined = combined & r
    else:
        combined = results[0]
        for r in results[1:]:
            combined = combined | r

    return combined


def _evaluate_indicator(
    df: pd.DataFrame,
    condition: IndicatorCondition
) -> pd.Series | None:
    """
    Evaluates a single indicator condition against the DataFrame.
    Finds the correct column dynamically.
    """
    indicator = condition.indicator.lower()
    period = condition.period
    value = condition.value
    operator = condition.operator

    col = _find_column(df, indicator, period)
    if col is None:
        print(f"Warning: could not find column for indicator '{indicator}'")
        return None

    series = df[col]

    if operator == "greater_than":
        return series > value
    elif operator == "less_than":
        return series < value
    elif operator == "crosses_above":
        return (series > value) & (series.shift(1) <= value)
    elif operator == "crosses_below":
        return (series < value) & (series.shift(1) >= value)
    elif operator == "equals":
        return series == value
    else:
        return None


def _find_column(df: pd.DataFrame, indicator: str, period: int | None) -> str | None:
    """
    Finds the DataFrame column that matches the indicator and period.
    Tries multiple naming patterns.
    """
    candidates = [
        f"{indicator}_{period}" if period else indicator,
        indicator,
        f"{indicator}_{period}_close" if period else f"{indicator}_close",
    ]

    for c in candidates:
        if c in df.columns:
            return c

    # fuzzy match — find any column starting with the indicator name
    for col in df.columns:
        if col.lower().startswith(indicator.lower()):
            return col

    return None