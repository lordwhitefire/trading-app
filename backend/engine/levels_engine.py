import pandas as pd
import numpy as np
from backend.models.strategy import LevelCondition


def calculate_levels(df: pd.DataFrame, conditions: list) -> dict:
    """
    Calculates all required levels from LevelCondition entries.
    Returns a dict of level arrays keyed by condition index.
    """
    levels = {}

    for i, condition in enumerate(conditions):
        if condition.type != "level":
            continue

        level_type = condition.level_type
        key = f"level_{i}_{level_type}"

        try:
            if level_type in ("support", "resistance"):
                levels[key] = _calculate_sr(df, condition)
            elif level_type == "fvg":
                levels[key] = _calculate_fvg(df)
            elif level_type == "order_block":
                levels[key] = _calculate_order_blocks(df, condition)
            elif level_type in ("supply_zone", "demand_zone"):
                levels[key] = _calculate_supply_demand(df, condition)
            elif level_type == "previous_high":
                levels[key] = _calculate_previous_extreme(df, "high", condition)
            elif level_type == "previous_low":
                levels[key] = _calculate_previous_extreme(df, "low", condition)
            elif level_type == "round_number":
                levels[key] = _calculate_round_numbers(df)
            elif level_type == "fibonacci_retracement":
                levels[key] = _calculate_fibonacci(df, condition)
            else:
                levels[key] = []

        except Exception as e:
            print(f"Warning: could not calculate level '{level_type}': {e}")
            levels[key] = []

    return levels


def evaluate_level_conditions(
    df: pd.DataFrame,
    conditions: list,
    levels: dict
) -> pd.Series:
    """
    For each candle, evaluates whether price satisfies each level condition.
    Returns a boolean Series.
    """
    results = []

    for i, condition in enumerate(conditions):
        if condition.type != "level":
            continue

        key = f"level_{i}_{condition.level_type}"
        level_list = levels.get(key, [])

        if not level_list:
            results.append(pd.Series(False, index=df.index))
            continue

        tolerance = condition.tolerance_pct / 100
        series = pd.Series(False, index=df.index)

        for idx in df.index:
            price = df.loc[idx, 'close']
            high = df.loc[idx, 'high']
            low = df.loc[idx, 'low']

            for level in level_list:
                tol_range = price * tolerance
                near = abs(price - level) <= tol_range

                if condition.interaction == "near" and near:
                    series[idx] = True
                    break
                elif condition.interaction == "touch":
                    if low <= level <= high:
                        series[idx] = True
                        break
                elif condition.interaction == "bounce":
                    if near and idx > 0:
                        prev_price = df.loc[idx - 1, 'close']
                        if abs(prev_price - level) <= tol_range:
                            series[idx] = True
                            break
                elif condition.interaction == "break":
                    if idx > 0:
                        prev_close = df.loc[idx - 1, 'close']
                        curr_close = df.loc[idx, 'close']
                        if (prev_close < level < curr_close or
                                prev_close > level > curr_close):
                            series[idx] = True
                            break

        results.append(series)

    if not results:
        return pd.Series(True, index=df.index)

    combined = results[0]
    for r in results[1:]:
        combined = combined & r
    return combined


# ─── Private helpers ─────────────────────────────────────────────────────────

def _calculate_sr(df: pd.DataFrame, condition: LevelCondition) -> list:
    lookback = condition.lookback
    min_touches = condition.min_touches
    tolerance = condition.tolerance_pct / 100

    highs = df['high'].values
    lows = df['low'].values
    closes = df['close'].values

    swing_highs = []
    swing_lows = []

    window = 5
    for i in range(window, len(df) - window):
        if highs[i] == max(highs[i - window:i + window + 1]):
            swing_highs.append(highs[i])
        if lows[i] == min(lows[i - window:i + window + 1]):
            swing_lows.append(lows[i])

    all_levels = swing_highs + swing_lows

    if condition.level_type == "support":
        candidates = swing_lows
    else:
        candidates = swing_highs

    validated = []
    for level in candidates:
        tol = level * tolerance
        touches = sum(
            1 for price in closes
            if abs(price - level) <= tol
        )
        if touches >= min_touches:
            validated.append(level)

    return validated


def _calculate_fvg(df: pd.DataFrame) -> list:
    gaps = []
    for i in range(2, len(df)):
        prev_high = df['high'].iloc[i - 2]
        curr_low = df['low'].iloc[i]
        prev_low = df['low'].iloc[i - 2]
        curr_high = df['high'].iloc[i]

        if curr_low > prev_high:
            mid = (curr_low + prev_high) / 2
            gaps.append(mid)
        elif curr_high < prev_low:
            mid = (curr_high + prev_low) / 2
            gaps.append(mid)

    return gaps


def _calculate_order_blocks(
    df: pd.DataFrame,
    condition: LevelCondition
) -> list:
    blocks = []
    lookback = min(condition.lookback, len(df))

    for i in range(1, lookback - 1):
        curr_range = df['high'].iloc[i] - df['low'].iloc[i]
        next_range = df['high'].iloc[i + 1] - df['low'].iloc[i + 1]

        if next_range > curr_range * 1.5:
            blocks.append(df['close'].iloc[i])

    return blocks


def _calculate_supply_demand(
    df: pd.DataFrame,
    condition: LevelCondition
) -> list:
    zones = []
    lookback = min(condition.lookback, len(df))

    for i in range(1, lookback - 1):
        body = abs(df['close'].iloc[i] - df['open'].iloc[i])
        total = df['high'].iloc[i] - df['low'].iloc[i]

        if total > 0 and body / total > 0.7:
            if condition.level_type == "demand_zone":
                if df['close'].iloc[i] > df['open'].iloc[i]:
                    zones.append(df['low'].iloc[i])
            else:
                if df['close'].iloc[i] < df['open'].iloc[i]:
                    zones.append(df['high'].iloc[i])

    return zones


def _calculate_previous_extreme(
    df: pd.DataFrame,
    col: str,
    condition: LevelCondition
) -> list:
    lookback = min(condition.lookback, len(df))
    val = df[col].iloc[:lookback].max() if col == "high" else df[col].iloc[:lookback].min()
    return [val]


def _calculate_round_numbers(df: pd.DataFrame) -> list:
    current_price = df['close'].iloc[-1]
    magnitude = 10 ** (len(str(int(current_price))) - 2)
    base = (int(current_price) // magnitude) * magnitude
    return [base + (magnitude * i) for i in range(-3, 4)]


def _calculate_fibonacci(
    df: pd.DataFrame,
    condition: LevelCondition
) -> list:
    lookback = min(condition.lookback, len(df))
    high = df['high'].iloc[:lookback].max()
    low = df['low'].iloc[:lookback].min()
    diff = high - low

    levels = [0.236, 0.382, 0.5, 0.618, 0.786]
    return [high - (diff * level) for level in levels]