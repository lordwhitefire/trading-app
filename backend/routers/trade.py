from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import httpx
import os
import time
import hmac
import hashlib
from supabase import create_client, Client

router = APIRouter(prefix="/api/trade", tags=["trade"])

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)

BYBIT_API_KEY = os.getenv('BYBIT_API_KEY', '')
BYBIT_API_SECRET = os.getenv('BYBIT_API_SECRET', '')

def _bybit_headers(params: dict) -> dict:
    if not BYBIT_API_KEY or not BYBIT_API_SECRET:
        return {}
    timestamp = str(int(time.time() * 1000))
    recv_window = "20000"
    query_string = "&".join([f"{k}={v}" for k, v in sorted(params.items())])
    sign_str = f"{timestamp}{BYBIT_API_KEY}{recv_window}{query_string}"
    signature = hmac.new(
        BYBIT_API_SECRET.encode('utf-8'),
        sign_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return {
        'X-BAPI-API-KEY': BYBIT_API_KEY,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-SIGN': signature,
        'X-BAPI-RECV-WINDOW': recv_window,
    }

# ---------- Schemas ----------

class CreateTradeRequest(BaseModel):
    user_id: str
    coin: str
    direction: str
    entry_price: float
    stop_loss_price: float
    take_profit_price: float
    leverage: float = 1.0
    amount: float = 100.0
    conditions_triggered: Optional[List[Any]] = []
    strategy_name: Optional[str] = None

class CloseTradeRequest(BaseModel):
    exit_price: float
    outcome: str
    pnl_pct: float
    pnl_usd: float

# ---------- Endpoints ----------

@router.post("/")
async def create_trade(body: CreateTradeRequest):
    result = (
        supabase.table("paper_trades")
        .insert({
            "user_id": body.user_id,
            "coin": body.coin,
            "direction": body.direction.upper(),
            "entry_price": body.entry_price,
            "stop_loss_price": body.stop_loss_price,
            "take_profit_price": body.take_profit_price,
            "leverage": body.leverage,
            "amount": body.amount,
            "conditions_triggered": body.conditions_triggered or [],
            "strategy_name": body.strategy_name,
            "status": "open",
        })
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create trade")
    return result.data[0]

@router.get("/")
async def get_trades(user_id: str):
    result = (
        supabase.table("paper_trades")
        .select("*")
        .eq("user_id", user_id)
        .order("opened_at", desc=True)
        .execute()
    )
    return result.data or []

@router.put("/{trade_id}/close")
async def close_trade(trade_id: str, body: CloseTradeRequest):
    from datetime import datetime, timezone
    result = (
        supabase.table("paper_trades")
        .update({
            "status": "closed",
            "outcome": body.outcome,
            "pnl_pct": body.pnl_pct,
            "pnl_usd": body.pnl_usd,
            "exit_price": body.exit_price,
            "closed_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", trade_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Trade not found")
    return result.data[0]

@router.get("/price/{coin}")
async def get_price(coin: str):
    symbol = coin.upper()
    if not symbol.endswith("USDT"):
        symbol = symbol + "USDT"

    params = {"category": "spot", "symbol": symbol}
    headers = _bybit_headers(params)
    url = f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={symbol}"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers=headers)

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Bybit API error")

    data = resp.json()
    try:
        price = float(data["result"]["list"][0]["lastPrice"])
        return {"coin": coin, "symbol": symbol, "price": price}
    except (KeyError, IndexError, ValueError):
        raise HTTPException(status_code=502, detail="Could not parse Bybit response")
