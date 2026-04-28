from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Literal, Union, Annotated
from pydantic import Field as PydanticField


# ─── Category 1: Indicator Condition ────────────────────────────────────────
class IndicatorCondition(BaseModel):
    type: Literal["indicator"] = "indicator"
    indicator: str
    operator: Literal[
        "greater_than",
        "less_than",
        "crosses_above",
        "crosses_below",
        "equals"
    ]
    value: float
    period: Optional[int] = None
    period2: Optional[int] = None


# ─── Category 2: Pattern Condition ──────────────────────────────────────────
class PatternCondition(BaseModel):
    type: Literal["pattern"] = "pattern"
    pattern: str
    direction: Literal["bullish", "bearish", "any"] = "any"


# ─── Category 3: Level Condition ────────────────────────────────────────────
class LevelCondition(BaseModel):
    type: Literal["level"] = "level"
    level_type: Literal[
        "support", "resistance", "trendline", "fvg",
        "order_block", "supply_zone", "demand_zone",
        "fibonacci_retracement", "previous_high", "previous_low", "round_number"
    ]
    interaction: Literal["touch", "bounce", "break", "near"] = "touch"
    tolerance_pct: float = 0.5
    lookback: int = 100
    min_touches: int = 2


# ─── Category 4: Confirmation Condition ─────────────────────────────────────
class ConfirmationCondition(BaseModel):
    type: Literal["confirmation"] = "confirmation"
    raw_text: str
    compiled: Optional[dict] = None
    candle_offset: int = 1
    description: str = ""


# ─── Union of all condition types ───────────────────────────────────────────
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
    leverage: float = Field(default=10.0, ge=1.0, le=100.0)
    amount: float = Field(default=100.0, gt=0)
    trade_duration: int = Field(default=48, gt=0)
    stop_loss_pct: float = Field(default=2.0, gt=0, le=99.0)
    take_profit_pct: float = Field(default=4.0, gt=0)

    @model_validator(mode='after')
    def validate_sl_above_liquidation(self) -> 'TradeAnalysisConfig':
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

    # ── Coin fields ──────────────────────────────────────────────────────────
    # coins is the new multi-coin field. coin is kept for backwards compatibility.
    # The validator below keeps them in sync no matter which the client sends.
    coin: str = "BTC/USDT"
    coins: List[str] = Field(default_factory=list)

    @model_validator(mode='after')
    def sync_coin_and_coins(self) -> 'Strategy':
        if self.coins and not self.coin:
            self.coin = self.coins[0]
        elif self.coin and not self.coins:
            self.coins = [self.coin]
        elif self.coins:
            self.coin = self.coins[0]   # coins is authoritative
        else:
            self.coin = "BTC/USDT"
            self.coins = ["BTC/USDT"]
        return self

    timeframe: str = "1h"
    backtest_period: int = Field(default=90, gt=0)
    direction: Literal["long", "short", "auto"] = Field(default="auto")
    logic: Literal["AND", "OR"] = "AND"
    conditions: List[AnyCondition] = Field(min_length=1)
    analysis_config: TradeAnalysisConfig = Field(default_factory=TradeAnalysisConfig)

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