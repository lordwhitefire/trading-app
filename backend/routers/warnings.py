from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.agents.warning_agent import review_strategy
from backend.utils.candle_calculator import get_max_safe_stop_loss

router = APIRouter()

@router.post("/api/warnings/")
async def get_strategy_warnings(strategy: Strategy):
    try:
        warnings = review_strategy(strategy)
        return {"warnings": warnings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/warnings/max-stop-loss/{leverage}")
async def get_max_stop_loss(leverage: float):
    try:
        max_sl = get_max_safe_stop_loss(leverage)
        liquidation_pct = round(100.0 / leverage, 2)
        return {
            "leverage": leverage,
            "liquidation_pct": liquidation_pct,
            "max_safe_stop_loss_pct": max_sl,
            "message": f"At {leverage}x leverage, liquidation occurs at {liquidation_pct}% loss. "
                       f"Your stop loss must be below {max_sl}%."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))