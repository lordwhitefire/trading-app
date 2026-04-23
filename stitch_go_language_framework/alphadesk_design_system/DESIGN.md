---
name: AlphaDesk Design System
colors:
  surface: '#0D0D0D'
  surface-dim: '#171309'
  surface-bright: '#3e392d'
  surface-container-lowest: '#110e05'
  surface-container-low: '#1f1b11'
  surface-container: '#231f14'
  surface-container-high: '#2e2a1e'
  surface-container-highest: '#393428'
  on-surface: '#ebe2d0'
  on-surface-variant: '#d1c6ab'
  inverse-surface: '#ebe2d0'
  inverse-on-surface: '#353024'
  outline: '#9a9078'
  outline-variant: '#4d4632'
  surface-tint: '#eec200'
  primary: '#ffecb9'
  on-primary: '#3c2f00'
  primary-container: '#facc15'
  on-primary-container: '#6c5700'
  inverse-primary: '#735c00'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#c7f5ff'
  on-tertiary: '#00363e'
  tertiary-container: '#33e4ff'
  on-tertiary-container: '#006270'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe083'
  primary-fixed-dim: '#eec200'
  on-primary-fixed: '#231b00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#a0efff'
  tertiary-fixed-dim: '#15daf4'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e59'
  background: '#000000'
  on-background: '#ebe2d0'
  surface-variant: '#393428'
  surface-elevated: '#141414'
  border: '#1F1F1F'
  border-hover: '#2E2E2E'
  accent: '#FACC15'
  accent-hover: '#FDE047'
  text-primary: '#FFFFFF'
  text-secondary: '#9CA3AF'
  text-muted: '#4B5563'
  success: '#22C55E'
  danger: '#EF4444'
  input-bg: '#111111'
typography:
  display:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  caption:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-lg:
    fontFamily: monospace
    fontSize: 30px
    fontWeight: '400'
    lineHeight: '1'
  data-sm:
    fontFamily: monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  page-px: 1.5rem
  page-py: 2rem
  card-p: 1.5rem
  section-gap: 2rem
  stack-gap: 2.5rem
  max-width: 1280px
---

# AlphaDesk — Google Stitch Design Prompt

## App Overview

**AlphaDesk** is a professional crypto trading strategy builder and backtesting platform. Users write strategies in plain English, the AI translates them into indicator conditions, and the app backtests them against real historical crypto data. The design should feel like a high-end fintech terminal — powerful, focused, and trustworthy.

---

## Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `background` | `#000000` | Page background |
| `surface` | `#0d0d0d` | Cards, panels |
| `surface-elevated` | `#141414` | Modals, dropdowns |
| `border` | `#1f1f1f` | Card borders, dividers |
| `border-hover` | `#2e2e2e` | Hover state borders |
| `accent` | `#FACC15` (yellow-400) | Primary CTA, highlights, icons |
| `accent-hover` | `#FDE047` (yellow-300) | Hover on accent elements |
| `text-primary` | `#FFFFFF` | Headings, important labels |
| `text-secondary` | `#9CA3AF` (gray-400) | Body text, descriptions |
| `text-muted` | `#4B5563` (gray-600) | Placeholders, subtle labels |
| `success` | `#22C55E` (green-500) | Win trades, positive PnL |
| `danger` | `#EF4444` (red-500) | Loss trades, negative PnL |
| `input-bg` | `#111111` | Form input backgrounds |

### Typography

- **Font**: Inter (Google Fonts)
- **Headings**: `font-bold`, tight letter-spacing
- **Body**: `font-normal`, relaxed line-height
- **Labels/Captions**: `text-sm`, `text-muted` or `text-secondary`
- **Numbers/Stats**: `font-mono` for data values

### Shapes & Elevation

- Border radius: `rounded-xl` (cards), `rounded-lg` (inputs/buttons), `rounded-full` (badges/tags)
- Cards: `bg-surface border border-border`
- No heavy drop shadows — use border contrast instead
- Hover: border color shifts from `border` → `border-hover`, subtle background lift

### Spacing

- Page padding: `px-6 py-8` on desktop, `px-4 py-6` on mobile
- Card padding: `p-6`
- Section gaps: `gap-8`, `mb-10`

---

## Global Components

### Navbar

- Full-width sticky top bar, `bg-black border-b border-border`
- Left: `AlphaDesk` logo — "Alpha" in white, "Desk" in `accent` yellow, bold
- Right: nav links — Builder | Results | Compare | Live — in `text-secondary`, hover turns `accent` yellow
- No hamburger menu on desktop — all links visible
- Mobile: collapse to a hamburger icon, slide-in drawer from right

### Page Layout

- Max-width `max-w-7xl mx-auto`
- All pages use the Navbar at top
- Content fills the rest of the viewport

---

## Pages

---

### Page 1: Home (`/`)

**Purpose**: Landing page — explain the product and drive users to the Builder.

**Layout**: Full-screen centered hero, feature cards below.

#### Hero Section

- Vertically and horizontally centered
- Heading: `AlphaDesk` — "Alpha" white, "Desk" `accent` yellow — `text-6xl font-bold`
- Subheading: "Build, backtest and analyze trading strategies with AI" — `text-xl text-secondary`
- Caption: "Powered by real market data from SoSoValue" — `text-sm text-muted`
- Two CTA buttons side by side:
  - Primary: "Build a Strategy" — `bg-accent text-black font-semibold px-8 py-3 rounded-lg hover:bg-accent-hover`
  - Secondary: "Live Signals" — `border border-border text-white px-8 py-3 rounded-lg hover:border-accent hover:text-accent`

#### Feature Cards Row

- `grid grid-cols-3 gap-8 mt-24` (stack to 1 column on mobile)
- Three equally sized cards with `bg-surface border border-border rounded-xl p-6 text-center`
- Each card:
  - **Icon**: large emoji or minimal SVG icon in `accent` yellow, `text-3xl mb-3`
  - **Title**: `font-semibold mb-2 text-primary`
  - **Description**: `text-sm text-secondary`
- Content:
  1. 📊 **Strategy Builder** — "Type your strategy in plain English or build manually with 130+ indicators"
  2. 🔁 **Backtesting Engine** — "Test your strategy against real historical crypto data with zero lookahead bias"
  3. 🤖 **AI Analysis** — "Multi-agent AI breaks down your results and tells you exactly what's working"

---

### Page 2: Builder (`/builder`)

**Purpose**: The core experience — configure and run a backtest.

**Layout**: Two-column split on desktop (left: form, right: AI assistant panel). Single column on mobile.

#### Left Column — Strategy Form

Container: `bg-surface border border-border rounded-xl p-6`

**Section: Basic Settings**

Row of 3 inputs side by side:
- **Strategy Name** (text input) — full width above the 3-col row
- **Coin** (select): BTC / ETH / SOL / BNB / ADA / AVAX — show coin logo icon next to each option
- **Timeframe** (select): 1m / 5m / 15m / 1h / 4h / 1d
- **Backtest Period** (number slider + input): 7 days → 365 days, show current value `"30 days"` next to slider

**Section: Risk Settings**

Row of 2 inputs:
- **Stop Loss %** — number input with `%` suffix
- **Trade Duration** — number input with `"candles"` suffix

**Section: Entry Logic**

- Logic toggle: `AND` / `OR` — pill-style toggle buttons

**Conditions List**

- Each condition is a **ConditionCard**:
  - `bg-surface-elevated border border-border rounded-lg px-4 py-3 flex items-center gap-3`
  - Left: indicator select dropdown (RSI, MACD, EMA, SMA, Bollinger Bands, Volume, ATR…)
  - Center: operator select (`>`, `<`, `=`, `crosses above`, `crosses below`)
  - Right: value input (number)
  - Optional: period input (e.g. `14` for RSI period) — shown if indicator requires it
  - Far right: small red `×` remove button
  - Below card (subtle): `text-xs text-muted` — AI-generated plain-English explanation of this condition
- Below conditions: `+ Add Condition` button — `border border-dashed border-border text-secondary hover:border-accent hover:text-accent rounded-lg py-2 w-full text-sm`

**Run Backtest Button**

- Full-width at the bottom: `bg-accent text-black font-bold py-3 rounded-lg hover:bg-accent-hover`
- While loading: show spinner + `"Running Backtest…"` text, button disabled

#### Right Column — AI Strategy Translator

Container: `bg-surface border border-border rounded-xl p-6 h-full`

- Header: "✨ AI Strategy Translator" in `text-primary font-semibold`
- Subtext: "Describe your strategy in plain English and AI will generate the conditions" — `text-sm text-muted`
- Large textarea: `bg-input-bg border border-border text-primary placeholder:text-muted rounded-lg p-4 w-full h-40 resize-none`
  - Placeholder: `"e.g. Buy when RSI is below 30 and the 50-day EMA crosses above the 200-day EMA"`
- `Translate →` button: `bg-accent text-black font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover mt-3`
- After translation, show a summary card below:
  - `bg-surface-elevated border border-border rounded-lg p-4 mt-4`
  - "AI Summary:" label in `text-xs text-muted uppercase tracking-widest`
  - Summary text in `text-sm text-secondary`

---

### Page 3: Results (`/results`)

**Purpose**: Show backtest output — summary stats, equity curve, per-signal table.

**Layout**: Full-width. Stats row at top, chart in middle, signals table below.

#### Summary Cards Row

`grid grid-cols-4 gap-4 mb-8` (2 cols on mobile)

Each card: `bg-surface border border-border rounded-xl p-5`

| Card | Value Style | Label |
|---|---|---|
| Total Signals | `text-3xl font-mono text-primary` | "Total Signals" |
| Win Rate | `text-3xl font-mono` — green if >50%, red if ≤50% | "Win Rate" |
| Total Return | `text-3xl font-mono` — green/red by value | "Total Return %" |
| Avg PnL per Trade | `text-3xl font-mono` — green/red by value | "Avg PnL / Trade" |

Each card also has a small sparkline or trend icon beneath the value.

#### Equity Curve Chart

- Full-width card: `bg-surface border border-border rounded-xl p-6 mb-8`
- Header: "Equity Curve" — `text-primary font-semibold`
- Chart: line chart, dark background, single `accent` yellow line
- X-axis: dates, `text-xs text-muted`
- Y-axis: portfolio value, `text-xs text-muted`
- Tooltip on hover: dark card showing date, value, % change

#### Signals Table

- Full-width card: `bg-surface border border-border rounded-xl p-6`
- Header: "Trade Signals" — `text-primary font-semibold`
- Table columns: Date | Coin | Entry Price | Conditions Met | Outcome | Duration | PnL %
- Header row: `text-xs text-muted uppercase tracking-widest border-b border-border`
- Data rows: `border-b border-border hover:bg-surface-elevated transition text-sm`
- Outcome column pill badge:
  - WIN: `bg-green-900/40 text-green-400 rounded-full px-2 py-0.5 text-xs font-medium`
  - LOSS: `bg-red-900/40 text-red-400 rounded-full px-2 py-0.5 text-xs font-medium`
- PnL column: `font-mono` — `text-success` if positive, `text-danger` if negative

---

### Page 4: Live Signals (`/live`)

**Purpose**: Show real-time signal activity, news, and ETF sentiment.

**Layout**: 2-column grid on desktop — left: signal feed, right: news + ETF panel.

#### Left — Live Signal Feed

- Header: `🟢 Live Signals` — green dot pulses with a CSS animation
- Each `SignalCard`: `bg-surface border border-border rounded-xl p-4 mb-3`
  - Coin tag badge: `bg-accent/10 text-accent rounded-full px-3 py-0.5 text-xs font-semibold`
  - Signal direction: "LONG ↑" in `text-success` or "SHORT ↓" in `text-danger` — `font-bold`
  - Conditions summary: small `text-xs text-muted` line
  - Timestamp: far right, `text-xs text-muted`

#### Right Column — Split Vertically

**News Panel** (top half)

- Header: "📰 Market News"
- Each news item:
  - `border-b border-border py-3`
  - Headline: `text-sm text-primary hover:text-accent cursor-pointer transition`
  - Source + time: `text-xs text-muted`
  - Sentiment badge: Bullish (green) / Bearish (red) / Neutral (gray)

**ETF Panel** (bottom half)

- Header: "📈 ETF Flow Tracker"
- Table: ETF Name | Net Flow | 24h Flow | Sentiment
- Positive flow: `text-success`
- Negative flow: `text-danger`
- Small directional arrow icon: ↑ or ↓ next to flow values

---

## Micro-Interactions & Animations

- **Button hover**: scale `1.02`, transition `150ms ease`
- **Card hover**: border color `border-border` → `border-border-hover`, transition `200ms`
- **Live signal dot**: CSS keyframe `pulse` animation — opacity 1 → 0.4 → 1 every 2s
- **Translator textarea**: focus ring in `accent` yellow glow: `ring-2 ring-yellow-400/40`
- **Form inputs**: focus border turns `accent` yellow
- **Loading spinner**: thin ring spinner in `accent` yellow on the Run Backtest button
- **Table rows**: `hover:bg-surface-elevated transition-colors duration-150`

---

## Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 640px` (mobile) | All grids stack to 1 column; Navbar collapses to hamburger |
| `640–1024px` (tablet) | 2-column grids; Builder form goes full width |
| `> 1024px` (desktop) | Full layout as described above |

---

## Empty & Loading States

- **No backtest run yet (Results page)**: centered empty state with a dashed border card, `"Run a backtest in the Builder to see results here"` in `text-muted`, and a `→ Go to Builder` link in `accent`.
- **Loading**: skeleton loader blocks in `bg-surface-elevated animate-pulse rounded` matching the card/table shapes.
- **Error**: red-tinted card `bg-red-900/20 border border-red-800 text-red-400 rounded-xl p-4` with error message.

---

## Component Inventory

| Component | Page(s) | Description |
|---|---|---|
| `Navbar` | All | Sticky top navigation |
| `StrategyForm` | Builder | Full strategy configuration form |
| `ConditionCard` | Builder | Single indicator condition row |
| `AIStrategyTranslator` | Builder | Plain-English → conditions panel |
| `IndicatorPanel` | Builder | Sidebar indicator browser |
| `SummaryCards` | Results | 4 stat cards (signals, win rate, return, avg PnL) |
| `TradeChart` | Results | Line chart for equity curve |
| `SignalsTable` | Results | Per-trade data table |
| `MonthlyChart` | Results | Monthly returns bar chart |
| `TimeHeatmap` | Results | Day/hour performance heatmap |
| `SignalCard` | Live | Individual live signal card |
| `NewsPanel` | Live | Market news feed |
| `ETFPanel` | Live | ETF flow tracker table |
