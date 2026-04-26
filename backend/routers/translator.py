from fastapi import APIRouter, HTTPException
import os
import re
import json
import traceback
from groq import Groq

router = APIRouter()


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences from LLM output."""
    text = text.strip()
    # Handle ```json ... ``` or ``` ... ```
    if text.startswith("```"):
        # Remove opening fence
        text = re.sub(r'^```(?:json)?\s*', '', text)
        # Remove closing fence
        text = re.sub(r'\s*```\s*$', '', text)
    return text.strip()


@router.post("/api/translator/")
async def translate_strategy(body: dict):
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")

    client = Groq(api_key=GROQ_API_KEY)

    prompt = f"""You are a trading strategy assistant. Translate this confirmation condition into JSON only.

Return ONLY valid JSON with this exact structure, nothing else, no markdown, no backticks:
{{
  "check": one of: close_above_open | close_below_open | candle_direction | price_above | price_below | volume_above_avg | higher_high | lower_low,
  "offset": integer (how many candles after signal to check, default 1),
  "direction": "bullish" or "bearish" (only if check is candle_direction),
  "value": float (only if check needs a value),
  "description": "plain English explanation of what this condition checks"
}}

User input: {text}"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=300,
        )
        raw = response.choices[0].message.content.strip()
        raw = _strip_markdown_fences(raw)
        parsed = json.loads(raw)
        return {
            "compiled": parsed,
            "description": parsed.get("description", ""),
            "summary": f"Checking {parsed.get('check', '')} at candle offset {parsed.get('offset', 1)}"
        }
    except json.JSONDecodeError as e:
        print(f"[translator] JSON parse error. Raw response: {raw!r}")
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")