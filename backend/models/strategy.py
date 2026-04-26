from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, model_validator


# ─── Category 1: Indicator Condition ────────────────────────────────────────
class IndicatorCondition(BaseModel):
    type: Literal["indicator"] = "indicator"
    indicator: str                          # e.g. "rsi", "ema", "macd"
    operator: Literal[
        "greater_than",
        "less_than",
        "crosses_above",
        "crosses_below",
        "equals"
    ]
    value: float                            # e.g. 30 for RSI < 30
    period: Optional[int] = None           # e.g. 14 for RSI period 14
    period2: Optional[int] = None          # for indicators needing 2 periods


# ─── Category 2: Pattern Condition ──────────────────────────────────────────
class PatternCondition(BaseModel):
    type: Literal["pattern"] = "pattern"
    pattern: str                            # e.g. "hammer", "doji", "engulfing"
    direction: Literal["bullish", "bearish", "any"] = "any"


# ─── Category 3: Level Condition ────────────────────────────────────────────
class LevelCondition(BaseModel):
    type: Literal["level"] = "level"
    level_type: Literal[
        "support",
        "resistance",
        "trendline",
        "fvg",                             # Fair Value Gap
        "order_block",
        "supply_zone",
        "demand_zone",
        "fibonacci_retracement",
        "previous_high",
        "previous_low",
        "round_number"
    ]
    interaction: Literal[
        "touch",                           # price touches the level
        "bounce",                          # price bounces off level
        "break",                           # price breaks through level
        "near"                             # price is within tolerance
    ] = "touch"
    tolerance_pct: float = 0.5            # how close price must be in %
    lookback: int = 100                   # candles to look back for level
    min_touches: int = 2                  # min historical touches to validate


# ─── Category 4: Confirmation Condition ─────────────────────────────────────
class ConfirmationCondition(BaseModel):
    type: Literal["confirmation"] = "confirmation"
    raw_text: str                          # original plain English from user
    compiled: Optional[dict] = None       # structured JSON from AI translator
    candle_offset: int = 1                # how many candles after signal to check
    description: str = ""                 # AI explanation shown to user


# ─── Union of all condition types ───────────────────────────────────────────
from typing import Union, Annotated
from pydantic import Field as PydanticField

AnyCondition = Annotated[
    Union[
        IndicatorCondition,
        PatternCondition,
        LevelCondition,
        ConfirmationCondition
    ],
    PydanticField(discriminator="type")
]


# ─── Trade Analysis Config ───────────────────────────────────────────────────
class TradeAnalysisConfig(BaseModel):
    leverage: float = Field(
        default=10.0, ge=1.0, le=100.0,
        description="Futures leverage multiplier e.g. 10 for 10x"
    )
    amount: float = Field(
        default=100.0, gt=0,
        description="Amount per trade in USD for PnL calculation"
    )
    trade_duration: int = Field(
        default=48, gt=0,
        description="Max candles to hold a trade before timeout"
    )
    stop_loss_pct: float = Field(
        default=2.0, gt=0, le=99.0,
        description="Stop loss as percentage distance from entry price"
    )
    take_profit_pct: float = Field(
        default=4.0, gt=0,
        description="Take profit as percentage distance from entry price"
    )

    @model_validator(mode='after')
    def validate_sl_above_liquidation(self) -> 'TradeAnalysisConfig':
        """
        Stop loss must not be deeper than the liquidation level.
        Liquidation happens at 100/leverage % move against you.
        Stop loss must be less than that to trigger before liquidation.
        """
        liquidation_pct = 100.0 / self.leverage
        if self.stop_loss_pct >= liquidation_pct:
            raise ValueError(
                f"Stop loss of {self.stop_loss_pct}% is at or beyond the "
                f"liquidation level of {round(liquidation_pct, 2)}% for "
                f"{self.leverage}x leverage. "
                f"Stop loss must be less than {round(liquidation_pct - 0.1, 2)}%."
            )
        return self



# ─── Main Strategy Model ─────────────────────────────────────────────────────
class Strategy(BaseModel):
    name: str
    coin: str                              # e.g. "BTC/USDT"
    timeframe: str                         # e.g. "1h", "4h", "1d"
    backtest_period: int = Field(
        default=90,
        gt=0,
        description="Number of candles for the backtest window"
    )
    direction: Literal["long", "short", "auto"] = Field(
        default="auto",
        description="Explicit trade direction. 'auto' infers from conditions."
    )
    logic: Literal["AND", "OR"] = "AND"
    conditions: List[AnyCondition] = Field(
        min_length=1,
        description="At least one condition required"
    )
    analysis_config: TradeAnalysisConfig = Field(
        default_factory=TradeAnalysisConfig
    )

    def get_max_lookback(self) -> int:
        max_lb = 0
        for c in self.conditions:
            if c.type == "indicator":
                p = c.period or 14
                p2 = c.period2 or 0
                max_lb = max(max_lb, p, p2)
            elif c.type == "level":
                max_lb = max(max_lb, c.lookback)
            elif c.type == "pattern":
                max_lb = max(max_lb, 5)
            elif c.type == "confirmation":
                max_lb = max(max_lb, c.candle_offset + 1)
        return max(max_lb, 50)