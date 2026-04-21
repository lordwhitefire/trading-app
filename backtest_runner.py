import pandas as pd
from datetime import datetime, timedelta
from backend.engine.data_fetcher import fetch_ohlcv
from backend.engine.indicator_engine import calculate_indicators
from backend.engine.condition_evaluator import evaluate_conditions
from backend.models.strategy import Strategy
from backend.models.signal import Signal

def run_backtest(strategy: Strategy):
    """
    Runs a backtest based on the provided strategy.
    
    :param strategy: Strategy object containing backtesting parameters and conditions
    :return: dict with backtest results
    """
    # Step 1 - Calculate date range
    end_date = datetime.today()
    start_date = end_date - timedelta(days=strategy.backtest_period)
    
    # Step 2 - Fetch data
    df = fetch_ohlcv(strategy.coin, strategy.timeframe, start_date, end_date)
    if df is None:
        raise ValueError("Failed to fetch OHLCV data")
    
    # Step 3 - Calculate indicators
    df = calculate_indicators(df, strategy.conditions)
    
    # Step 4 - Evaluate conditions
    signal_series = evaluate_conditions(df, strategy.conditions, strategy.logic)
    
    # Step 5 - Loop through signals
    signals = []
    for i in range(1, len(signal_series) - 1):
        if signal_series[i]:
            entry_price = df['open'][i + 1]
            exit_price = None
            pnl = None
            outcome = None
            
            for j in range(i + 1, min(len(df), i + 1 + strategy.trade_duration)):
                if df['low'][j] <= entry_price * (1 - strategy.stop_loss / 100):
                    exit_price = entry_price * (1 - strategy.stop_loss / 100)
                    pnl = -strategy.stop_loss
                    outcome = "loss"
                    break
            else:
                exit_price = df['close'][j]
                pnl = ((exit_price - entry_price) / entry_price) * 100
                outcome = "win" if pnl > 0 else "loss"
            
            signals.append(Signal(
                timestamp=df['timestamp'][i],
                entry_price=entry_price,
                exit_price=exit_price,
                pnl=pnl,
                outcome=outcome
            ))
    
    # Step 6 - Calculate summary stats
    total_signals = len(signals)
    win_rate = sum(1 for signal in signals if signal.outcome == "win") / total_signals * 100 if total_signals > 0 else 0
    total_return = sum(signal.pnl for signal in signals)
    avg_pnl = total_return / total_signals if total_signals > 0 else 0
    
    # Step 7 - Return results
    return {
        "signals": [signal.dict() for signal in signals],
        "total_signals": total_signals,
        "win_rate": win_rate,
        "total_return": total_return,
        "avg_pnl": avg_pnl
    }
