import pandas as pd
from backend.models.strategy import ConfirmationCondition


def evaluate_confirmations(
    df: pd.DataFrame,
    conditions: list
) -> pd.Series:
    """
    Evaluates confirmation conditions against the DataFrame.
    Each confirmation condition has a compiled dict from the AI translator.
    Confirmation checks happen at candle_offset candles after the signal.
    """
    results = []

    for condition in conditions:
        if not condition.compiled:
            print(f"Warning: confirmation condition has no compiled JSON — skipping")
            results.append(pd.Series(True, index=df.index))
            continue

        series = _run_compiled_confirmation(df, condition)
        results.append(series)

    if not results:
        return pd.Series(True, index=df.index)

    combined = results[0]
    for r in results[1:]:
        combined = combined & r
    return combined


def _run_compiled_confirmation(
    df: pd.DataFrame,
    condition: ConfirmationCondition
) -> pd.Series:
    """
    Executes a compiled confirmation condition.
    The compiled dict must have this structure:
    {
        "check": "candle_direction" | "price_above" | "price_below" |
                 "volume_above_avg" | "close_above_open" | "close_below_open",
        "offset": int,       # how many candles forward to check
        "value": float       # optional threshold value
    }
    """
    compiled = condition.compiled
    check = compiled.get("check", "")
    offset = compiled.get("offset", condition.candle_offset)
    value = compiled.get("value", None)

    series = pd.Series(False, index=df.index)

    for i in df.index:
        target_i = i + offset
        if target_i >= len(df):
            continue

        target_row = df.iloc[target_i]

        try:
            if check == "close_above_open":
                series[i] = target_row['close'] > target_row['open']

            elif check == "close_below_open":
                series[i] = target_row['close'] < target_row['open']

            elif check == "candle_direction":
                direction = compiled.get("direction", "bullish")
                if direction == "bullish":
                    series[i] = target_row['close'] > target_row['open']
                else:
                    series[i] = target_row['close'] < target_row['open']

            elif check == "price_above" and value is not None:
                series[i] = target_row['close'] > value

            elif check == "price_below" and value is not None:
                series[i] = target_row['close'] < value

            elif check == "volume_above_avg":
                avg_vol = df['volume'].iloc[max(0, i - 20):i].mean()
                series[i] = target_row['volume'] > avg_vol * (value or 1.5)

            elif check == "higher_high":
                series[i] = target_row['high'] > df['high'].iloc[i]

            elif check == "lower_low":
                series[i] = target_row['low'] < df['low'].iloc[i]

            else:
                series[i] = True

        except Exception as e:
            print(f"Warning: confirmation check failed at index {i}: {e}")
            series[i] = False

    return series


def get_confirmation_check_types() -> list:
    """
    Returns all supported confirmation check types for the frontend.
    """
    return [
        {
            "check": "close_above_open",
            "label": "Next candle is bullish (close > open)",
            "needs_value": False
        },
        {
            "check": "close_below_open",
            "label": "Next candle is bearish (close < open)",
            "needs_value": False
        },
        {
            "check": "candle_direction",
            "label": "Next candle direction (bullish or bearish)",
            "needs_value": False
        },
        {
            "check": "price_above",
            "label": "Price closes above a specific value",
            "needs_value": True
        },
        {
            "check": "price_below",
            "label": "Price closes below a specific value",
            "needs_value": True
        },
        {
            "check": "volume_above_avg",
            "label": "Volume is above average (default 1.5x)",
            "needs_value": True
        },
        {
            "check": "higher_high",
            "label": "Next candle makes a higher high",
            "needs_value": False
        },
        {
            "check": "lower_low",
            "label": "Next candle makes a lower low",
            "needs_value": False
        },
    ]