from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import os
from datetime import datetime, timezone
from supabase import create_client, Client

router = APIRouter(prefix="/api/device", tags=["device"])

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_KEY"],
)


# ---------- Helpers ----------

def upsert_device_data(key: str, value: Any):
    supabase.table("device_data").upsert(
        {
            "key": key,
            "value": value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        on_conflict="key"
    ).execute()


def get_device_data(key: str) -> Optional[dict]:
    result = supabase.table("device_data").select("*").eq("key", key).execute()
    if result.data:
        return result.data[0]
    return None


# ---------- Schemas ----------

class PricesPayload(BaseModel):
    prices: Dict[str, float]


class OhlcvPayload(BaseModel):
    coin: str
    timeframe: str
    candles: List[List[Any]]


class PositionsPayload(BaseModel):
    positions: List[Any]


class TradeResultPayload(BaseModel):
    trade_id: str
    bybit_order_id: Optional[str] = None
    status: str
    outcome: Optional[str] = None
    exit_price: Optional[float] = None
    pnl_pct: Optional[float] = None
    pnl_usd: Optional[float] = None


# ---------- POST Endpoints ----------

@router.post("/prices")
async def receive_prices(body: PricesPayload):
    try:
        upsert_device_data("live_prices", {
            "prices": body.prices,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ohlcv")
async def receive_ohlcv(body: OhlcvPayload):
    try:
        key = f"ohlcv_{body.coin.replace('/', '')}_{body.timeframe}"
        upsert_device_data(key, {
            "coin": body.coin,
            "timeframe": body.timeframe,
            "candles": body.candles,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/positions")
async def receive_positions(body: PositionsPayload):
    try:
        upsert_device_data("open_positions", {
            "positions": body.positions,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trade-result")
async def receive_trade_result(body: TradeResultPayload):
    try:
        update_data: Dict[str, Any] = {"status": body.status}

        if body.bybit_order_id:
            update_data["bybit_order_id"] = body.bybit_order_id
        if body.outcome:
            update_data["outcome"] = body.outcome
        if body.exit_price is not None:
            update_data["exit_price"] = body.exit_price
        if body.pnl_pct is not None:
            update_data["pnl_pct"] = body.pnl_pct
        if body.pnl_usd is not None:
            update_data["pnl_usd"] = body.pnl_usd
        if body.status == "closed":
            update_data["closed_at"] = datetime.now(timezone.utc).isoformat()

        supabase.table("paper_trades").update(update_data).eq("id", body.trade_id).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------- GET Endpoints ----------

@router.get("/prices")
async def get_prices():
    try:
        row = get_device_data("live_prices")
        if not row:
            return {"prices": {}, "updated_at": None}
        val = row["value"]
        return {
            "prices": val.get("prices", {}),
            "updated_at": val.get("updated_at"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/positions")
async def get_positions():
    try:
        row = get_device_data("open_positions")
        if not row:
            return {"positions": [], "updated_at": None}
        val = row["value"]
        return {
            "positions": val.get("positions", []),
            "updated_at": val.get("updated_at"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))