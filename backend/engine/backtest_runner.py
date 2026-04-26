import pandas as pd
from datetime import datetime
from backend.models.strategy import Strategy
from backend.models.signal import Signal, BacktestResult
from backend.engine.data_fetcher import fetch_ohlcv
from backend.engine.condition_evaluator import evaluate_all_conditions
from backend.utils.candle_calculator import (
    calculate_pnl,
    calculate_stop_loss_price,
    calculate_take_profit_price,
)


def run_backtest(strategy: Strategy) -> BacktestResult:
    # ── Step 1: Fetch data ────────────────────────────────────────────────────
    fetch_result = fetch_ohlcv(strategy)
    df = fetch_result["df"]
    analysis_start = fetch_result["analysis_start_index"]
    warmup_candles = fetch_result["warmup_candles"]

    if df.empty:
        raise Exception("No data returned from data fetcher")

    # ── Step 2: Evaluate all conditions ──────────────────────────────────────
    signal_series = evaluate_all_conditions(df, strategy)

    # ── Step 3: Loop through backtest window ──────────────────────────────────
    cfg = strategy.analysis_config
    leverage = cfg.leverage
    amount = cfg.amount
    trade_duration = cfg.trade_duration
    sl_pct = cfg.stop_loss_pct
    tp_pct = cfg.take_profit_pct

    signals = []
    wins = 0
    losses = 0
    expired_wins = 0
    expired_losses = 0

    for i in range(analysis_start, len(df) - 1):
        if not signal_series.iloc[i]:
            continue

        if i + 1 >= len(df):
            continue

        entry_candle = df.iloc[i + 1]
        entry_price = float(entry_candle['open'])
        entry_time = str(df['timestamp'].iloc[i])
        direction = _detect_direction(strategy, df, i)

        # Calculate SL and TP prices
        sl_price = calculate_stop_loss_price(entry_price, sl_pct, direction)
        tp_price = calculate_take_profit_price(entry_price, tp_pct, direction)

        # ── Step 4: Evaluate trade candle by candle ───────────────────────────
        outcome = None
        exit_price = None
        duration_candles = trade_duration

        for j in range(i + 1, min(i + 1 + trade_duration, len(df))):
            candle = df.iloc[j]
            low = float(candle['low'])
            high = float(candle['high'])
            close = float(candle['close'])

            if direction == "long":
                # Check stop loss
                if low <= sl_price:
                    outcome = "loss"
                    exit_price = sl_price
                    duration_candles = j - i
                    break
                # Check take profit
                if high >= tp_price:
                    outcome = "win"
                    exit_price = tp_price
                    duration_candles = j - i
                    break

            else:  # short
                # Check stop loss
                if high >= sl_price:
                    outcome = "loss"
                    exit_price = sl_price
                    duration_candles = j - i
                    break
                # Check take profit
                if low <= tp_price:
                    outcome = "win"
                    exit_price = tp_price
                    duration_candles = j - i
                    break

        # ── Step 5: Handle timeout ────────────────────────────────────────────
        if outcome is None:
            last_j = min(i + trade_duration, len(df) - 1)
            exit_price = float(df['close'].iloc[last_j])
            duration_candles = trade_duration

            pnl_check = calculate_pnl(
                entry_price, exit_price, direction, leverage, amount
            )
            if pnl_check["pnl_pct"] > 0:
                outcome = "expired-win"
                expired_wins += 1
            else:
                outcome = "expired-loss"
                expired_losses += 1
        elif outcome == "win":
            wins += 1
        else:
            losses += 1

        # ── Step 6: Calculate PnL ─────────────────────────────────────────────
        pnl_data = calculate_pnl(
            entry_price, exit_price, direction, leverage, amount
        )

        conditions_met = [
            f"{c.type}:{getattr(c, 'indicator', getattr(c, 'pattern', getattr(c, 'level_type', 'confirmation')))}"
            for c in strategy.conditions
        ]

        signals.append(Signal(
            date=entry_time,
            coin=strategy.coin,
            timeframe=strategy.timeframe,
            direction=direction,
            entry_price=entry_price,
            exit_price=exit_price,
            stop_loss_price=sl_price,
            take_profit_price=tp_price,
            outcome=outcome,
            duration_candles=duration_candles,
            pnl_pct=pnl_data["pnl_pct"],
            pnl_usd=pnl_data["pnl_usd"],
            conditions_met=conditions_met,
        ))

    # ── Step 7: Summary stats ─────────────────────────────────────────────────
    total = len(signals)
    total_wins = wins + expired_wins
    win_rate = (total_wins / total * 100) if total > 0 else 0
    total_return_pct = sum(s.pnl_pct for s in signals)
    total_return_usd = sum(s.pnl_usd for s in signals)
    avg_pnl = (total_return_pct / total) if total > 0 else 0

    # Max drawdown
    cumulative = 0
    peak = 0
    max_drawdown = 0
    for s in signals:
        cumulative += s.pnl_pct
        if cumulative > peak:
            peak = cumulative
        drawdown = peak - cumulative
        if drawdown > max_drawdown:
            max_drawdown = drawdown

    return BacktestResult(
        strategy_name=strategy.name,
        coin=strategy.coin,
        timeframe=strategy.timeframe,
        backtest_period=strategy.backtest_period,
        total_candles_fetched=len(df),
        warmup_candles=warmup_candles,
        total_signals=total,
        wins=wins,
        losses=losses,
        expired_wins=expired_wins,
        expired_losses=expired_losses,
        win_rate=round(win_rate, 2),
        total_return_pct=round(total_return_pct, 4),
        total_return_usd=round(total_return_usd, 4),
        avg_pnl_pct=round(avg_pnl, 4),
        max_drawdown_pct=round(max_drawdown, 4),
        signals=signals,
    )


def _detect_direction(strategy: Strategy, df: pd.DataFrame, i: int) -> str:
    # If the user explicitly set a direction, always use it
    if strategy.direction in ("long", "short"):
        return strategy.direction

    # 'auto' mode: infer from conditions (pattern > indicator > level)
    for condition in strategy.conditions:
        if condition.type == "pattern":
            if condition.direction == "bearish":
                return "short"
            elif condition.direction == "bullish":
                return "long"

        if condition.type == "indicator":
            indicator = condition.indicator.lower()
            if indicator in ("rsi", "cci", "mfi", "stoch", "stochrsi"):
                if condition.operator == "less_than" and condition.value <= 35:
                    return "long"
                elif condition.operator == "greater_than" and condition.value >= 65:
                    return "short"

        if condition.type == "level":
            if condition.level_type in ("support", "demand_zone"):
                return "long"
            elif condition.level_type in ("resistance", "supply_zone"):
                return "short"

    return "long"