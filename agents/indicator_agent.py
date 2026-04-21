from backend.engine.indicator_engine import calculate_indicators

def indicator_agent(df, conditions):
    return calculate_indicators(df, conditions)
