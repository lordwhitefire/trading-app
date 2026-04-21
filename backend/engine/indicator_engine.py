import pandas as pd
import pandas_ta as ta

def calculate_indicators(df, conditions):
    for condition in conditions:
        try:
            if condition.period:
                indicator_func = getattr(ta, condition.indicator)
                df[condition.indicator] = indicator_func(df, length=condition.period)
            else:
                indicator_func = getattr(ta, condition.indicator)
                df[condition.indicator] = indicator_func(df)
        except AttributeError as e:
            raise Exception(f"Unsupported indicator: {condition.indicator}") from e
    return df

def get_available_indicators():
    return [attr for attr in dir(ta) if callable(getattr(ta, attr)) and not attr.startswith('_')]
