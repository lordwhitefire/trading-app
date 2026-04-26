import pandas as pd
import pandas_ta as ta
from backend.models.strategy import PatternCondition


AVAILABLE_PATTERNS = [
    "2crows", "3blackcrows", "3inside", "3linestrike", "3outside",
    "3starsinsouth", "3whitesoldiers", "abandonedbaby", "advanceblock",
    "belthold", "breakaway", "closingmarubozu", "concealbabyswall",
    "counterattack", "darkcloudcover", "doji", "dojistar", "dragonflydoji",
    "engulfing", "eveningdojistar", "eveningstar", "gapsidesidewhite",
    "gravestonedoji", "hammer", "hangingman", "harami", "haramicross",
    "highwave", "hikkake", "hikkakemod", "homingpigeon", "identical3crows",
    "inneck", "inside", "invertedhammer", "kicking", "kickingbylength",
    "ladderbottom", "longleggeddoji", "longline", "marubozu", "matchinglow",
    "mathold", "morningdojistar", "morningstar", "onneck", "piercing",
    "rickshawman", "risefall3methods", "separatinglines", "shootingstar",
    "shortline", "spinningtop", "stalledpattern", "sticksandwich",
    "takuri", "tasukigap", "thrusting", "tristar", "unique3river",
    "upsidegap2crows", "xsidegap3methods"
]


def detect_patterns(df: pd.DataFrame, conditions: list) -> pd.DataFrame:
    """
    Detects candlestick patterns for all PatternCondition entries.
    Adds a boolean column per pattern to the DataFrame.
    """
    df = df.copy()

    for condition in conditions:
        if condition.type != "pattern":
            continue

        pattern_name = condition.pattern.lower()
        col_key = f"pattern_{pattern_name}"

        try:
            # Use only OHLCV columns — datetime columns cause
            # "Invalid comparison between dtype=datetime64 and int"
            ohlcv_cols = [c for c in ['open', 'high', 'low', 'close', 'volume']
                          if c in df.columns]
            df_copy = df[ohlcv_cols].copy()
            df_copy.index = range(len(df_copy))
            result = df_copy.ta.cdl_pattern(name=pattern_name)

            if result is None or result.empty:
                df[col_key] = False
                continue

            col = result.columns[0]
            raw = result[col]

            if condition.direction == "bullish":
                df[col_key] = raw > 0
            elif condition.direction == "bearish":
                df[col_key] = raw < 0
            else:
                df[col_key] = raw != 0

        except Exception as e:
            print(f"Warning: could not detect pattern '{pattern_name}': {e}")
            df[col_key] = False

    return df


def get_available_patterns() -> list:
    return sorted(AVAILABLE_PATTERNS)