import pandas as pd
from datetime import datetime, timedelta

from backend.engine.data_fetcher import fetch_ohlcv
from backend.engine.indicator_engine import calculate_indicators
from backend.engine.condition_evaluator import evaluate_conditions
from backend.models.strategy import Strategy
from backend.models.signal import Signal

def run_backtest(strategy):
    end_date = datetime.today()
    start_date = end_date - timedelta(days=strategy.backtest_period)
    
    df = fetch_ohlcv(strategy.coin, strategy.timeframe, start_date, end_date)
    df = calculate_indicators(df, strategy.conditions)
    
    signal_series = evaluate_conditions(df, strategy.conditions, strategy.logic)
    
    signals = []
    total_signals = 0
    win_rate = 0
    total_return = 0
    avg_pnl = 0
    
    for i in range(1, len(df) - 1):
        if signal_series[i]:
            entry_price = df['open'][i + 1]
            exit_price = None
            pnl = None
            
            for j in range(i + 1, min(len(df), i + strategy.trade_duration)):
                if df['low'][j] <= strategy.stop_loss:
                    exit_price = strategy.stop_loss
                    pnl = ((exit_price - entry_price) / entry_price) * 100
                    outcome = 'loss'
                    break
            else:
                exit_price = df['close'][i + strategy.trade_duration]
                pnl = ((exit_price - entry_price) / entry_price) * 100
                outcome = 'win'
            
            signals.append(Signal(
                date=df.index[i].strftime('%Y-%m-%d %H:%M:%S'),
                coin=strategy.coin,
                price=entry_price,
                conditions_met=[condition.indicator for condition in strategy.conditions if signal_series[i]],
                outcome=outcome,
                duration=j - i + 1,
                pnl=pnl
            ))
            
            total_signals += 1
            if outcome == 'win':
                win_rate += 1
            total_return += pnl
    
    if total_signals > 0:
        win_rate /= total_signals
        avg_pnl = total_return / total_signals
    
    return {
        'signals': signals,
        'total_signals': total_signals,
        'win_rate': win_rate * 100,
        'total_return': total_return,
        'avg_pnl': avg_pnl
    }
