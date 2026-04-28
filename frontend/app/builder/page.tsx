'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import {
  runBacktest,
  getAvailableIndicators,
  getAvailablePatterns,
  getAvailableLevels,
  getStrategyWarnings,
  getMaxStopLoss,
  getAvailableCoins,
} from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
type ConditionType = 'indicator' | 'pattern' | 'level' | 'confirmation';
type Direction = 'bullish' | 'bearish' | 'both';

interface IndicatorCond {
  type: 'indicator';
  indicator: string;
  operator: string;
  value: number;
  period?: number;
}
interface PatternCond {
  type: 'pattern';
  pattern: string;
  direction: 'bullish' | 'bearish' | 'any';
}
interface LevelCond {
  type: 'level';
  level_type: string;
  interaction: string;
  tolerance_pct: number;
  lookback: number;
  min_touches: number;
}
interface ConfirmationCond {
  type: 'confirmation';
  raw_text: string;
  compiled: any;
  description: string;
  candle_offset: number;
}
type AnyCondition = IndicatorCond | PatternCond | LevelCond | ConfirmationCond;

// ─── Style constants ──────────────────────────────────────────────────────────
const inputClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]";
const selectClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer";
const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-2";
const sectionClass = "bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 space-y-5";

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const OPERATORS = [
  { value: 'less_than', label: '< Less than' },
  { value: 'greater_than', label: '> Greater than' },
  { value: 'crosses_above', label: '↑ Crosses above' },
  { value: 'crosses_below', label: '↓ Crosses below' },
  { value: 'equals', label: '= Equals' },
];
const DIRECTIONS = ['bullish', 'bearish', 'any'];
const INTERACTIONS = ['touch', 'bounce', 'break', 'near'];

// ─── Multi-coin searchable selector with tags ─────────────────────────────────
function CoinMultiSelect({ allCoins, selected, onChange }: {
  allCoins: string[];
  selected: string[];
  onChange: (coins: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = allCoins.filter(
    c => c.toLowerCase().includes(query.toLowerCase()) && !selected.includes(c)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = (coin: string) => { onChange([...selected, coin]); setQuery(''); };
  const remove = (coin: string) => onChange(selected.filter(c => c !== coin));

  return (
    <div ref={ref} className="relative">
      {/* Tags + trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className="min-h-[46px] w-full bg-[#111111] border border-[#1F1F1F] rounded-lg px-3 py-2 focus-within:border-[#FACC15] transition-colors cursor-pointer flex flex-wrap gap-1.5 items-center"
      >
        {selected.length === 0 && (
          <span className="text-[#4B5563] text-sm">Select coins...</span>
        )}
        {selected.map(coin => (
          <span key={coin}
            className="inline-flex items-center gap-1 bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] text-xs font-semibold px-2 py-0.5 rounded">
            {coin}
            <button type="button"
              onClick={e => { e.stopPropagation(); remove(coin); }}
              className="hover:text-white transition-colors leading-none">×</button>
          </span>
        ))}
        <span className="ml-auto text-[#4B5563] text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#111111] border border-[#1F1F1F] rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#1F1F1F]">
            <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="🔍 Search coin..."
              className="w-full bg-[#0D0D0D] border border-[#1F1F1F] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]" />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-[#4B5563] text-sm">
                {query ? 'No coins found' : 'All coins selected'}
              </li>
            ) : (
              filtered.map(c => (
                <li key={c} onClick={() => add(c)}
                  className="px-4 py-2.5 text-sm cursor-pointer text-white hover:bg-[#1F1F1F] transition-colors flex items-center justify-between">
                  {c}
                  <span className="text-[#4B5563] text-xs">+ Add</span>
                </li>
              ))
            )}
          </ul>
          {selected.length > 0 && (
            <div className="p-2 border-t border-[#1F1F1F]">
              <button type="button" onClick={() => onChange([])}
                className="w-full text-xs text-red-400/60 hover:text-red-400 transition-colors py-1">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const router = useRouter();
  const { user, saveStrategyToDB, saveResultsToDB, addStrategy, setBacktestResults, strategyToLoad, setStrategyToLoad } = useStore();

  // ─── Strategy settings ────────────────────────────────────────────────────
  const [name, setName] = useState('ALPHAV1_MOMENTUM');
  const [coins, setCoins] = useState<string[]>(['BTC/USDT']); // multi-coin
  const [timeframe, setTimeframe] = useState('1h');
  const [backtestPeriod, setBacktestPeriod] = useState(100);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [direction, setDirection] = useState<Direction>('bullish');   // ← NEW

  // ─── Trade analysis config ────────────────────────────────────────────────
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState(100);
  const [tradeDuration, setTradeDuration] = useState(24);
  const [stopLossPct, setStopLossPct] = useState(2);
  const [takeProfitPct, setTakeProfitPct] = useState(4);
  const [maxSafeSL, setMaxSafeSL] = useState(9.9);

  // ─── Conditions ───────────────────────────────────────────────────────────
  const [conditions, setConditions] = useState<AnyCondition[]>([
    { type: 'indicator', indicator: 'rsi', operator: 'less_than', value: 35, period: 14 }
  ]);

  // ─── API data ─────────────────────────────────────────────────────────────
  const [indicators, setIndicators] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [levelTypes, setLevelTypes] = useState<any[]>([]);
  const [availableCoins, setAvailableCoins] = useState<string[]>(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);

  // ─── UI state ─────────────────────────────────────────────────────────────
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ConditionType>('indicator');
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ─── Fetch API data on mount ──────────────────────────────────────────────
  useEffect(() => {
    getAvailableIndicators().then(r => setIndicators(r.indicators)).catch(console.error);
    getAvailablePatterns().then(r => setPatterns(r.patterns)).catch(console.error);
    getAvailableLevels().then(r => setLevelTypes(r.level_types)).catch(console.error);
    getAvailableCoins()
      .then(r => setAvailableCoins(r.coins.map((c: string) => c.replace('USDT', '/USDT'))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getMaxStopLoss(leverage)
      .then(r => setMaxSafeSL(r.max_safe_stop_loss_pct))
      .catch(() => setMaxSafeSL(parseFloat((100 / leverage - 0.1).toFixed(2))));
    if (stopLossPct >= 100 / leverage) {
      setStopLossPct(parseFloat((100 / leverage - 0.5).toFixed(1)));
    }
  }, [leverage]);

  // ─── Issue 2: Populate builder from loaded strategy ───────────────────────
  useEffect(() => {
    if (!strategyToLoad) return;
    const s = strategyToLoad;
    if (s.name) setName(s.name);
    // coins: prefer coins array, fall back to single coin string
    if (s.coins?.length) setCoins(s.coins);
    else if (s.coin) setCoins([s.coin]);
    if (s.timeframe) setTimeframe(s.timeframe);
    if (s.backtest_period) setBacktestPeriod(s.backtest_period);
    if (s.logic) setLogic(s.logic);
    if (s.direction) {
      // map backend direction back to UI direction
      const map: Record<string, Direction> = { long: 'bullish', short: 'bearish', auto: 'both' };
      setDirection(map[s.direction] ?? 'bullish');
    }
    if (s.conditions?.length) setConditions(s.conditions);
    if (s.analysis_config) {
      if (s.analysis_config.leverage != null) setLeverage(s.analysis_config.leverage);
      if (s.analysis_config.amount != null) setAmount(s.analysis_config.amount);
      if (s.analysis_config.trade_duration != null) setTradeDuration(s.analysis_config.trade_duration);
      if (s.analysis_config.stop_loss_pct != null) setStopLossPct(s.analysis_config.stop_loss_pct);
      if (s.analysis_config.take_profit_pct != null) setTakeProfitPct(s.analysis_config.take_profit_pct);
    }
    setStrategyToLoad(null); // clear so it doesn't re-trigger
  }, [strategyToLoad]);
  const addCondition = (type: ConditionType) => {
    if (type === 'indicator') {
      setConditions([...conditions, { type: 'indicator', indicator: indicators[0] || 'rsi', operator: 'less_than', value: 30, period: 14 }]);
    } else if (type === 'pattern') {
      setConditions([...conditions, { type: 'pattern', pattern: patterns[0] || 'hammer', direction: 'bullish' }]);
    } else if (type === 'level') {
      setConditions([...conditions, { type: 'level', level_type: 'support', interaction: 'touch', tolerance_pct: 0.5, lookback: 100, min_touches: 2 }]);
    } else if (type === 'confirmation') {
      setConditions([...conditions, { type: 'confirmation', raw_text: '', compiled: null, description: '', candle_offset: 1 }]);
    }
  };

  const removeCondition = (index: number) => setConditions(conditions.filter((_, i) => i !== index));

  const updateCondition = (index: number, updates: Partial<AnyCondition>) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], ...updates } as AnyCondition;
    setConditions(updated);
  };

  // ─── AI translator ────────────────────────────────────────────────────────
  const handleAiTranslate = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/translator/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (data.compiled) {
        setConditions([...conditions, {
          type: 'confirmation', raw_text: aiText, compiled: data.compiled,
          description: data.description || '', candle_offset: data.compiled.offset || 1,
        }]);
        setAiText('');
      }
    } catch (e) { console.error('AI translate error:', e); }
    finally { setAiLoading(false); }
  };

  // ─── Warnings ─────────────────────────────────────────────────────────────
  const checkWarnings = async () => {
    if (conditions.length === 0) return;
    setWarningsLoading(true);
    try {
      const res = await getStrategyWarnings(buildStrategy());
      setWarnings(res.warnings || []);
    } catch (e) { console.error('Warnings error:', e); }
    finally { setWarningsLoading(false); }
  };

  // ─── Build strategy ───────────────────────────────────────────────────────
  const directionMap: Record<Direction, 'long' | 'short' | 'auto'> = {
    bullish: 'long',
    bearish: 'short',
    both: 'auto',
  };
  const buildStrategy = () => ({
    name,
    coins,                          // multi-coin array for backend
    coin: coins[0] || 'BTC/USDT',  // backwards compat — backend syncs automatically
    timeframe, backtest_period: backtestPeriod, logic,
    direction: directionMap[direction],
    conditions,
    analysis_config: { leverage, amount, trade_duration: tradeDuration, stop_loss_pct: stopLossPct, take_profit_pct: takeProfitPct },
  });

  // ─── Run backtest ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) { setError('Strategy name is required.'); return; }
    if (coins.length === 0) { setError('Select at least one coin.'); return; }
    if (conditions.length === 0) { setError('Add at least one condition.'); return; }
    if (stopLossPct >= maxSafeSL) { setError(`Stop loss must be less than ${maxSafeSL}% for ${leverage}x leverage.`); return; }
    setLoading(true); setError('');
    try {
      const strategy = buildStrategy();
      const results = await runBacktest(strategy);
      setBacktestResults(results);
      addStrategy(strategy);
      router.push('/results');
      if (user) await saveResultsToDB(strategy, results);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to run backtest.');
    } finally { setLoading(false); }
  };

  const isValid = name.trim() && coins.length > 0 && conditions.length > 0 && stopLossPct < maxSafeSL;

  // ─── Direction config ─────────────────────────────────────────────────────
  const directionConfig: Record<Direction, { label: string; icon: string; color: string; activeBg: string; activeText: string }> = {
    bullish: { label: 'Bullish', icon: '↑', color: '#22c55e', activeBg: 'bg-green-500/20 border-green-500', activeText: 'text-green-400' },
    bearish: { label: 'Bearish', icon: '↓', color: '#ef4444', activeBg: 'bg-red-500/20 border-red-500', activeText: 'text-red-400' },
    both: { label: 'Both', icon: '↕', color: '#FACC15', activeBg: 'bg-[#FACC15]/20 border-[#FACC15]', activeText: 'text-[#FACC15]' },
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 pb-32">
      <h1 className="text-white font-black text-3xl mb-8 uppercase tracking-tight">
        Strategy <span className="text-[#FACC15]">Builder</span>
      </h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div className="w-full lg:w-3/5 space-y-6">

          {/* Strategy Settings */}
          <div className={sectionClass}>
            <h2 className="text-white font-bold text-lg">Strategy Settings</h2>

            <div>
              <label className={labelClass}>Strategy Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className={inputClass} placeholder="e.g. ALPHAV1_MOMENTUM" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ── Multi-coin selector ── */}
              <div>
                <label className={labelClass}>Coins ({coins.length} selected)</label>
                <CoinMultiSelect
                  allCoins={availableCoins}
                  selected={coins}
                  onChange={setCoins}
                />
              </div>

              <div>
                <label className={labelClass}>Timeframe</label>
                <div className="relative">
                  <select value={timeframe} onChange={e => setTimeframe(e.target.value)} className={selectClass}>
                    {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] text-xs">▼</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className={labelClass + ' mb-0'}>Backtest Period</label>
                <span className="text-[#FACC15] text-xs font-semibold uppercase">{backtestPeriod} candles</span>
              </div>
              <input type="range" min={50} max={1000} value={backtestPeriod}
                onChange={e => setBacktestPeriod(parseInt(e.target.value))}
                className="w-full accent-[#FACC15] cursor-pointer" />
            </div>

            <div>
              <label className={labelClass}>Entry Logic</label>
              <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-[#1F1F1F]">
                {(['AND', 'OR'] as const).map(l => (
                  <button key={l} onClick={() => setLogic(l)}
                    className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${logic === l ? 'bg-[#FACC15] text-black' : 'bg-[#111111] text-[#4B5563] hover:text-white'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Strategy Direction ── */}
            <div>
              <label className={labelClass}>Strategy Direction</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(directionConfig) as [Direction, typeof directionConfig[Direction]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setDirection(key)}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border text-sm font-bold uppercase tracking-widest transition-all
                      ${direction === key
                        ? `${cfg.activeBg} ${cfg.activeText}`
                        : 'bg-[#111111] border-[#1F1F1F] text-[#4B5563] hover:text-white hover:border-[#4B5563]'
                      }`}
                  >
                    <span className="text-xl leading-none">{cfg.icon}</span>
                    <span className="text-[10px]">{cfg.label}</span>
                  </button>
                ))}
              </div>
              {/* Live indicator badge */}
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full`}
                  style={{ backgroundColor: directionConfig[direction].color }} />
                <span className="text-xs text-[#4B5563]">
                  This strategy will look for{' '}
                  <span style={{ color: directionConfig[direction].color }} className="font-semibold">
                    {direction === 'both' ? 'long & short' : direction} trades
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Trade Analysis Config */}
          <div className={sectionClass}>
            <h2 className="text-white font-bold text-lg">Trade Analysis Config</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Leverage</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={100} value={leverage}
                    onChange={e => setLeverage(parseFloat(e.target.value) || 1)} className={inputClass} />
                  <span className="text-[#FACC15] font-bold text-sm whitespace-nowrap">× {leverage}</span>
                </div>
                <p className="text-[10px] text-[#4B5563] mt-1">Liquidation at {(100 / leverage).toFixed(1)}% move against you</p>
              </div>
              <div>
                <label className={labelClass}>Amount (USD)</label>
                <input type="number" min={1} value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 1)} className={inputClass} placeholder="100" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className={labelClass + ' mb-0'}>Trade Duration</label>
                <span className="text-[#FACC15] text-xs font-semibold uppercase">{tradeDuration} candles</span>
              </div>
              <input type="range" min={1} max={500} value={tradeDuration}
                onChange={e => setTradeDuration(parseInt(e.target.value))}
                className="w-full accent-[#FACC15] cursor-pointer" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stop Loss %</label>
                <input type="number" step={0.1} min={0.1} max={maxSafeSL} value={stopLossPct}
                  onChange={e => setStopLossPct(parseFloat(e.target.value) || 0.1)}
                  className={`${inputClass} ${stopLossPct >= maxSafeSL ? 'border-red-500' : ''}`} />
                <p className={`text-[10px] mt-1 ${stopLossPct >= maxSafeSL ? 'text-red-400' : 'text-[#4B5563]'}`}>
                  Max safe: {maxSafeSL}% for {leverage}x leverage
                </p>
              </div>
              <div>
                <label className={labelClass}>Take Profit %</label>
                <input type="number" step={0.1} min={0.1} value={takeProfitPct}
                  onChange={e => setTakeProfitPct(parseFloat(e.target.value) || 0.1)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className={sectionClass}>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Conditions</h2>
              <span className="text-[#4B5563] text-xs">{conditions.length} added</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['indicator', 'pattern', 'level', 'confirmation'] as ConditionType[]).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${activeTab === t
                    ? 'bg-[#FACC15] text-black'
                    : 'bg-[#111111] border border-[#1F1F1F] text-[#4B5563] hover:text-white'}`}>
                  {t}
                </button>
              ))}
              <button onClick={() => addCondition(activeTab)}
                className="ml-auto px-4 py-1.5 border border-dashed border-[#1F1F1F] hover:border-[#FACC15] text-[#4B5563] hover:text-[#FACC15] rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors">
                + Add {activeTab}
              </button>
            </div>

            <div className="space-y-3">
              {conditions.length === 0 && (
                <div className="text-center py-8 text-[#4B5563] text-sm border border-dashed border-[#1F1F1F] rounded-lg">
                  No conditions added yet. Add at least one to run a backtest.
                </div>
              )}

              {conditions.map((cond, i) => (
                <div key={i} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#FACC15] border border-[#FACC15]/30 bg-[#FACC15]/10 px-2 py-0.5 rounded">
                      {cond.type} {String(i + 1).padStart(2, '0')}
                    </span>
                    <button onClick={() => removeCondition(i)} className="text-red-500/60 hover:text-red-500 transition-colors text-xs">✕ Remove</button>
                  </div>

                  {cond.type === 'indicator' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Indicator</label>
                        <select value={cond.indicator} onChange={e => updateCondition(i, { indicator: e.target.value })} className={selectClass}>
                          {indicators.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Operator</label>
                        <select value={cond.operator} onChange={e => updateCondition(i, { operator: e.target.value })} className={selectClass}>
                          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Value</label>
                        <input type="number" value={cond.value}
                          onChange={e => updateCondition(i, { value: parseFloat(e.target.value) || 0 })}
                          className={inputClass} placeholder="e.g. 30" />
                      </div>
                      <div>
                        <label className={labelClass}>Period (optional)</label>
                        <input type="number" value={cond.period || ''}
                          onChange={e => updateCondition(i, { period: parseInt(e.target.value) || undefined })}
                          className={inputClass} placeholder="e.g. 14" />
                      </div>
                    </div>
                  )}

                  {cond.type === 'pattern' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Pattern</label>
                        <select value={cond.pattern} onChange={e => updateCondition(i, { pattern: e.target.value })} className={selectClass}>
                          {patterns.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Direction</label>
                        <select value={cond.direction} onChange={e => updateCondition(i, { direction: e.target.value as any })} className={selectClass}>
                          {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {cond.type === 'level' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelClass}>Level Type</label>
                        <select value={cond.level_type} onChange={e => updateCondition(i, { level_type: e.target.value })} className={selectClass}>
                          {levelTypes.map((l: any) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Interaction</label>
                        <select value={cond.interaction} onChange={e => updateCondition(i, { interaction: e.target.value })} className={selectClass}>
                          {INTERACTIONS.map(it => <option key={it} value={it}>{it}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Tolerance %</label>
                        <input type="number" step={0.1} value={cond.tolerance_pct}
                          onChange={e => updateCondition(i, { tolerance_pct: parseFloat(e.target.value) || 0.5 })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Lookback candles</label>
                        <input type="number" value={cond.lookback}
                          onChange={e => updateCondition(i, { lookback: parseInt(e.target.value) || 100 })} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Min Touches</label>
                        <input type="number" min={1} value={cond.min_touches}
                          onChange={e => updateCondition(i, { min_touches: parseInt(e.target.value) || 2 })} className={inputClass} />
                      </div>
                    </div>
                  )}

                  {cond.type === 'confirmation' && (
                    <div className="space-y-3">
                      <div>
                        <label className={labelClass}>Describe in plain English</label>
                        <textarea value={cond.raw_text}
                          onChange={e => updateCondition(i, { raw_text: e.target.value })}
                          className={`${inputClass} h-20 resize-none`}
                          placeholder="e.g. Next candle must be bullish and close above the open" />
                      </div>
                      {cond.compiled && (
                        <div className="bg-[#0D0D0D] border border-[#FACC15]/20 rounded-lg p-3 space-y-2">
                          <p className="text-[10px] text-[#4B5563] uppercase tracking-widest">AI Translation</p>
                          <p className="text-sm text-white">{cond.description}</p>
                          <div className="border-t border-[#1F1F1F] pt-2">
                            <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">Compiled JSON</p>
                            <pre className="text-xs text-[#FACC15] overflow-auto">{JSON.stringify(cond.compiled, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                      <button
                        onClick={async () => {
                          if (!cond.raw_text.trim()) return;
                          try {
                            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/translator/`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ text: cond.raw_text }),
                            });
                            const data = await res.json();
                            updateCondition(i, { compiled: data.compiled, description: data.description || data.compiled?.description || '', candle_offset: data.compiled?.offset || 1 });
                          } catch (e) { console.error(e); }
                        }}
                        className="text-xs text-[#FACC15] border border-[#FACC15]/30 px-3 py-1.5 rounded-lg hover:bg-[#FACC15]/10 transition-colors">
                        ✨ Translate with AI
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 space-y-3">
              <h2 className="text-white font-bold text-lg">⚠️ Strategy Warnings</h2>
              {warnings.map((w, i) => (
                <div key={i} className={`rounded-lg p-3 text-sm ${w.severity === 'danger' ? 'bg-red-900/20 border border-red-800 text-red-400'
                  : w.severity === 'warning' ? 'bg-yellow-900/20 border border-yellow-800 text-yellow-400'
                    : 'bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF]'}`}>
                  {w.message}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-4 text-sm">{error}</div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={checkWarnings} disabled={warningsLoading || conditions.length === 0}
              className="flex-1 border border-[#1F1F1F] hover:border-[#FACC15] text-[#9CA3AF] hover:text-[#FACC15] font-semibold py-4 rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-40">
              {warningsLoading ? 'Checking...' : '⚠️ Check Warnings'}
            </button>

            {user && (
              <button onClick={async () => { await saveStrategyToDB(buildStrategy()); alert('Strategy saved!'); }}
                className="border border-[#FACC15]/30 text-[#FACC15] font-semibold py-4 px-6 rounded-xl uppercase tracking-widest text-sm hover:bg-[#FACC15]/10 transition-all">
                💾 Save
              </button>
            )}

            <button onClick={handleSubmit} disabled={loading || !isValid}
              className="flex-grow bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Running...
                </>
              ) : '▶ Run Backtest'}
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN — AI Translator ─────────────────────────────── */}
        <div className="w-full lg:w-2/5 lg:sticky lg:top-24">
          <div className={sectionClass}>
            <h2 className="text-white font-bold text-lg">✨ AI Strategy Translator</h2>
            <p className="text-[#4B5563] text-sm">
              Describe your full strategy or a confirmation condition in plain English.
              AI will translate it into structured conditions.
            </p>
            <textarea value={aiText} onChange={e => setAiText(e.target.value)}
              className={`${inputClass} h-40 resize-none`}
              placeholder='"Buy when RSI is below 30 and the next candle is bullish and closes above the previous high"' />
            <button onClick={handleAiTranslate} disabled={aiLoading || !aiText.trim()}
              className="w-full bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-40 text-black font-bold py-3 rounded-lg uppercase tracking-widest text-sm transition-all">
              {aiLoading ? 'Translating...' : 'Translate →'}
            </button>

            <div className="border-t border-[#1F1F1F] pt-4 space-y-2">
              <p className="text-[10px] text-[#4B5563] uppercase tracking-widest">Condition Types</p>
              {[
                { icon: '📊', label: 'Indicator', desc: 'RSI, EMA, MACD, Bollinger Bands...' },
                { icon: '🕯️', label: 'Pattern', desc: 'Hammer, Doji, Engulfing, Shooting Star...' },
                { icon: '📏', label: 'Level', desc: 'Support, Resistance, FVG, Order Block...' },
                { icon: '✅', label: 'Confirmation', desc: 'Next candle direction, volume spike...' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 py-2">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-white text-xs font-semibold">{item.label}</p>
                    <p className="text-[#4B5563] text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}