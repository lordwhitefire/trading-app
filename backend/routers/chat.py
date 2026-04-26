from fastapi import APIRouter, HTTPException
import os
import json
from groq import Groq

router = APIRouter()

@router.post("/api/chat/")
async def chat_with_results(body: dict):
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    question = body.get("question", "")
    results = body.get("results", {})
    signal = body.get("signal", None)

    if not question:
        raise HTTPException(status_code=400, detail="No question provided")

    client = Groq(api_key=GROQ_API_KEY)

    if signal:
        context = f"""
You are a trading analysis assistant. A user is asking about a specific trade signal from their backtest results.

Signal Details:
- Date: {signal.get('date', 'N/A')}
- Coin: {signal.get('coin', 'N/A')}
- Direction: {signal.get('direction', 'N/A')}
- Entry Price: {signal.get('entry_price', 'N/A')}
- Exit Price: {signal.get('exit_price', 'N/A')}
- Stop Loss Price: {signal.get('stop_loss_price', 'N/A')}
- Take Profit Price: {signal.get('take_profit_price', 'N/A')}
- Outcome: {signal.get('outcome', 'N/A')}
- Duration: {signal.get('duration_candles', 'N/A')} candles
- PnL: {signal.get('pnl_pct', 'N/A')}%
- Conditions Met: {', '.join(signal.get('conditions_met', []))}

Overall Backtest Context:
- Total Signals: {results.get('total_signals', 'N/A')}
- Win Rate: {results.get('win_rate', 'N/A')}%
- Total Return: {results.get('total_return_pct', 'N/A')}%
"""
    else:
        context = f"""
You are a trading analysis assistant. A user is asking questions about their backtest results.

Backtest Results Summary:
- Strategy: {results.get('strategy_name', 'N/A')}
- Coin: {results.get('coin', 'N/A')}
- Timeframe: {results.get('timeframe', 'N/A')}
- Total Signals: {results.get('total_signals', 'N/A')}
- Wins: {results.get('wins', 'N/A')}
- Losses: {results.get('losses', 'N/A')}
- Expired Wins: {results.get('expired_wins', 'N/A')}
- Expired Losses: {results.get('expired_losses', 'N/A')}
- Win Rate: {results.get('win_rate', 'N/A')}%
- Total Return: {results.get('total_return_pct', 'N/A')}%
- Average PnL: {results.get('avg_pnl_pct', 'N/A')}%
- Max Drawdown: {results.get('max_drawdown_pct', 'N/A')}%
- Signals: {json.dumps(results.get('signals', [])[:10])}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
            max_tokens=500,
        )
        answer = response.choices[0].message.content.strip()
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")