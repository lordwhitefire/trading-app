import pandas as pd
import sys

def evaluate_conditions(df, conditions, logic):
    """
    Evaluates each condition against the DataFrame based on the specified logic ("AND" or "OR").
    
    :param df: pandas DataFrame with OHLCV data and indicator columns already added
    :param conditions: list of Condition objects
    :param logic: str, either "AND" or "OR"
    :return: boolean Series where True means all conditions are met (AND) or any condition is met (OR)
    """
    
    def greater_than(df, indicator, value):
        return df[indicator] > value
    
    def less_than(df, indicator, value):
        return df[indicator] < value
    
    def crosses_above(df, indicator, value):
        return (df[indicator] > value) & (df[indicator].shift(1) <= value)
    
    def crosses_below(df, indicator, value):
        return (df[indicator] < value) & (df[indicator].shift(1) >= value)
    
    condition_results = []
    
    for condition in conditions:
        if hasattr(condition, 'operator'):
            operator = getattr(sys.modules[__name__], condition.operator)
            result = operator(df, condition.indicator, condition.value)
            condition_results.append(result)
    
    if logic == "AND":
        return all(condition_results, axis=1)
    elif logic == "OR":
        return any(condition_results, axis=1)
    else:
        raise ValueError("Unsupported logic: {}".format(logic))
