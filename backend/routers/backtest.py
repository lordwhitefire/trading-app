from fastapi import APIRouter, HTTPException
from backend.models.strategy import Strategy
from backend.engine.backtest_runner import run_backtest

router = APIRouter()

@router.post("/api/backtest/")
async def backtest_strategy(strategy: Strategy):
    try:
        # Single coin — original behaviour unchanged
        if len(strategy.coins) <= 1:
            result = run_backtest(strategy)
            return result.dict()

        # Multi-coin — run backtest for each coin and return keyed dict
        all_results = {}
        errors = {}

        for coin in strategy.coins:
            try:
                # Temporarily override coin for this run
                single = strategy.model_copy(update={"coin": coin, "coins": [coin]})
                result = run_backtest(single)
                all_results[coin] = result.dict()
            except Exception as e:
                errors[coin] = str(e)

        if not all_results:
            # Every coin failed — raise with all error messages
            raise HTTPException(
                status_code=500,
                detail=f"All coins failed: {errors}"
            )

        # Return multi-coin payload
        # Partial failures are included so frontend can show them
        return {
            "multi_coin": True,
            "coins": list(all_results.keys()),
            "results": all_results,
            "errors": errors,   # empty dict if all succeeded
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))