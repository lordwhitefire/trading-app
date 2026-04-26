from fastapi import APIRouter
from backend.engine.confirmation_engine import get_confirmation_check_types

router = APIRouter()

@router.get("/api/levels")
async def get_level_types():
    return {
        "level_types": [
            {"value": "support", "label": "Support Level"},
            {"value": "resistance", "label": "Resistance Level"},
            {"value": "trendline", "label": "Trendline"},
            {"value": "fvg", "label": "Fair Value Gap (FVG)"},
            {"value": "order_block", "label": "Order Block"},
            {"value": "supply_zone", "label": "Supply Zone"},
            {"value": "demand_zone", "label": "Demand Zone"},
            {"value": "fibonacci_retracement", "label": "Fibonacci Retracement"},
            {"value": "previous_high", "label": "Previous High"},
            {"value": "previous_low", "label": "Previous Low"},
            {"value": "round_number", "label": "Round Number / Psychological Level"},
        ],
        "interactions": [
            {"value": "touch", "label": "Price touches the level"},
            {"value": "bounce", "label": "Price bounces off the level"},
            {"value": "break", "label": "Price breaks through the level"},
            {"value": "near", "label": "Price is near the level"},
        ]
    }