from fastapi import APIRouter, HTTPException
import os
import json
from groq import Groq

router = APIRouter()

# ─── Agent schemas injected into prompts ─────────────────────────────────────

INDICATOR_SCHEMA = """
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "summary": "one sentence overall assessment",
  "top_performers": [{"indicator": "RSI", "insight": "explanation"}],
  "worst_performers": [{"indicator": "MACD", "insight": "explanation"}],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
"""

TIME_SCHEMA = """
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "summary": "one sentence overall assessment",
  "best_hours": [{"hour": "14:00-16:00", "insight": "explanation"}],
  "worst_hours": [{"hour": "02:00-04:00", "insight": "explanation"}],
  "best_days": [{"day": "Tuesday", "insight": "explanation"}],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
"""

SUMMARY_SCHEMA = """
Return ONLY valid JSON in this exact format, no markdown, no explanation:
{
  "summary": "one sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "overall_rating": "Good",
  "recommendations": ["recommendation 1", "recommendation 2"]
}
Note: overall_rating must be exactly one of: "Good", "Average", or "Poor".
"""

# Map agent keys to their schemas
AGENT_SCHEMAS = {
    "indicator": INDICATOR_SCHEMA,
    "time": TIME_SCHEMA,
    "summary": SUMMARY_SCHEMA,
    # multi-coin agents — return plain text (compared across coins, hard to schema)
    "comparison": None,
    "best_coin": None,
    "risk": None,
}


# ─── Context builders (unchanged logic, kept clean) ───────────────────────────

def build_single_coin_context(results: dict, signal: dict | None = None) -> str:
    if signal:
        return f"""
You are a trading analysis assistant. A user is asking about a specific trade signal from their backtest results.

Signal Details:
- Date: {signal.get('date', 'N/A')}
- Coin: {signal.get('coin', 'N/A')}
- Direction: {signal.get('direction', 'N/A')}
- Entry Price: {signal.get('entry_price', 'N/A')}
- Exit Price: {signal.get('exit_price', 'N/A')}
- Stop Loss: {signal.get('stop_loss_price', 'N/A')}
- Take Profit: {signal.get('take_profit_price', 'N/A')}
- Outcome: {signal.get('outcome', 'N/A')}
- Duration: {signal.get('duration_candles', 'N/A')} candles
- PnL: {signal.get('pnl_pct', 'N/A')}%
- Conditions Met: {', '.join(signal.get('conditions_met', []))}

Overall Backtest Context:
- Total Signals: {results.get('total_signals', 'N/A')}
- Win Rate: {results.get('win_rate', 'N/A')}%
- Total Return: {results.get('total_return_pct', 'N/A')}%
""".strip()

    return f"""
You are a trading analysis assistant. A user is asking questions about their backtest results.

Backtest Results Summary:
- Strategy: {results.get('strategy_name', 'N/A')}
- Coin: {results.get('coin', 'N/A')}
- Timeframe: {results.get('timeframe', 'N/A')}
- Backtest Period: {results.get('backtest_period', 'N/A')} candles
- Total Signals: {results.get('total_signals', 'N/A')}
- Wins: {results.get('wins', 'N/A')}
- Losses: {results.get('losses', 'N/A')}
- Expired Wins: {results.get('expired_wins', 'N/A')}
- Expired Losses: {results.get('expired_losses', 'N/A')}
- Win Rate: {results.get('win_rate', 'N/A')}%
- Total Return: {results.get('total_return_pct', 'N/A')}%
- Average PnL per Trade: {results.get('avg_pnl_pct', 'N/A')}%
- Max Drawdown: {results.get('max_drawdown_pct', 'N/A')}%
- Sample Signals (first 10): {json.dumps(results.get('signals', [])[:10])}
""".strip()


def build_multi_coin_context(results: dict) -> str:
    coins = results.get('coins', [])
    coin_results = results.get('results', {})

    lines = [
        "You are a trading analysis assistant. A user is asking questions about their multi-coin backtest results.",
        "",
        f"This strategy was backtested across {len(coins)} coins: {', '.join(coins)}.",
        "",
        "Here are the full results for each coin:",
        "",
    ]

    for coin in coins:
        r = coin_results.get(coin)
        if not r:
            lines.append(f"## {coin}: No data available\n")
            continue

        total = r.get('total_signals', 0)
        wins = (r.get('wins', 0) or 0) + (r.get('expired_wins', 0) or 0)
        losses = (r.get('losses', 0) or 0) + (r.get('expired_losses', 0) or 0)

        lines.append(f"## {coin}")
        lines.append(f"- Timeframe: {r.get('timeframe', 'N/A')}")
        lines.append(f"- Backtest Period: {r.get('backtest_period', 'N/A')} candles")
        lines.append(f"- Total Signals: {total}")
        lines.append(f"- Wins (clean): {r.get('wins', 0)}")
        lines.append(f"- Losses (clean): {r.get('losses', 0)}")
        lines.append(f"- Expired Wins: {r.get('expired_wins', 0)}")
        lines.append(f"- Expired Losses: {r.get('expired_losses', 0)}")
        lines.append(f"- Total Wins (incl. expired): {wins}")
        lines.append(f"- Total Losses (incl. expired): {losses}")
        lines.append(f"- Win Rate: {r.get('win_rate', 'N/A')}%")
        lines.append(f"- Total Return: {r.get('total_return_pct', 'N/A')}%")
        lines.append(f"- Average PnL per Trade: {r.get('avg_pnl_pct', 'N/A')}%")
        lines.append(f"- Max Drawdown: {r.get('max_drawdown_pct', 'N/A')}%")
        lines.append("")

    lines.append("Use ALL of the above data when answering. Do not say data is unavailable — it is all provided above.")
    return "\n".join(lines)


# ─── JSON parser — strips markdown fences if model wraps output ───────────────

def try_parse_json(text: str) -> dict | None:
    """Attempt to parse JSON from model output, stripping markdown fences."""
    text = text.strip()
    # Strip ```json ... ``` or ``` ... ```
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(text)
    except Exception:
        return None


# ─── Router ───────────────────────────────────────────────────────────────────

@router.post("/api/chat/")
async def chat_with_results(body: dict):
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    question = body.get("question", "")
    results  = body.get("results", {})
    signal   = body.get("signal", None)
    agent    = body.get("agent", None)   # NEW: frontend passes agent key

    if not question:
        raise HTTPException(status_code=400, detail="No question provided")

    # ── Build context ──────────────────────────────────────────────────────────
    is_multi = results.get("multi_coin") is True or results.get("multi_coin") == "true"
    context  = build_multi_coin_context(results) if is_multi else build_single_coin_context(results, signal)

    # ── Append schema instruction if this is a structured agent call ──────────
    schema = AGENT_SCHEMAS.get(agent) if agent else None
    user_message = question
    if schema:
        user_message = f"{question}\n\n{schema}"

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": context},
                {"role": "user",   "content": user_message},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        raw = response.choices[0].message.content.strip()

        # ── If structured agent: parse JSON and return as structured field ──
        if schema:
            parsed = try_parse_json(raw)
            if parsed:
                return {"answer": raw, "structured": parsed}
            # Fallback: return raw if JSON parse fails
            return {"answer": raw, "structured": None}

        return {"answer": raw}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")