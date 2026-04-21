import os
import pandas as pd
import pandas_ta as ta

# Retrieve API key from environment variable
SOSOVALUE_API_KEY = os.getenv("SOSOVALUE_API_KEY")

def calculate_indicators(df, conditions):
    """
    Calculates technical indicators using pandas-ta.
    
    :param df: pandas DataFrame with OHLCV data
    :param conditions: list of Condition objects
    :return: pandas DataFrame with all indicator columns added
    """
    for condition in conditions:
        try:
            if hasattr(ta, condition.name):
                method = getattr(ta, condition.name)
                if 'period' in condition.__dict__:
                    df[condition.name] = method(df, length=condition.period)
                else:
                    df[condition.name] = method(df)
            else:
                raise ValueError(f"Unsupported indicator: {condition.name}")
        except Exception as e:
            print(f"Error calculating {condition.name}: {e}")
    
    return df

def get_available_indicators():
    """
    Returns a list of all available indicator names in pandas-ta.
    
    :return: list of str
    """
    return [name for name in dir(ta) if callable(getattr(ta, name)) and not name.startswith("__")]
