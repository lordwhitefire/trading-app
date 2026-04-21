import pandas as pd
from datetime import datetime

from backend.engine.data_fetcher import fetch_live_price
from backend.engine.indicator_engine import calculate_indicators
from backend.engine.condition_evaluator import evaluate_conditions
from backend.models.signal import LiveSignal

def generate_live_signal(strategy, df):
    df = calculate_indicators(df, strategy.conditions)
    signal_series = evaluate_conditions(df, strategy.conditions, strategy.logic)
    
    if not signal_series.empty and signal_series.iloc[-1]:
        current_price = fetch_live_price(strategy.coin)
        time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        conditions_triggered = [condition.indicator for condition in strategy.conditions if signal_series.iloc[-1]]
        confidence_score = strategy.win_rate
        
        return LiveSignal(
            coin=strategy.coin,
            price=current_price,
            time=time,
            conditions_triggered=conditions_triggered,
            confidence_score=confidence_score
        )
    
    return None
