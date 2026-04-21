import pandas as pd

def evaluate_conditions(df, conditions, logic):
    results = []
    for condition in conditions:
        if condition.operator == 'greater_than':
            result = df[condition.indicator] > condition.value
        elif condition.operator == 'less_than':
            result = df[condition.indicator] < condition.value
        elif condition.operator == 'crosses_above':
            result = (df[condition.indicator] > condition.value) & (df[condition.indicator].shift(1) <= condition.value)
        elif condition.operator == 'crosses_below':
            result = (df[condition.indicator] < condition.value) & (df[condition.indicator].shift(1) >= condition.value)
        else:
            raise Exception(f"Unsupported operator: {condition.operator}")
        results.append(result)
    
    if logic == 'AND':
        return pd.concat(results, axis=1).all(axis=1)
    elif logic == 'OR':
        return pd.concat(results, axis=1).any(axis=1)
    else:
        raise Exception(f"Unsupported logic: {logic}")
