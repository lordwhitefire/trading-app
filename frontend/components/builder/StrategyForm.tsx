'use client';

import React, { useState, useEffect, useRef } from 'react';
import { runBacktest, getAvailableIndicators, getAvailableCoins } from '@/lib/api';
import ConditionCard from './ConditionCard';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface Condition {
  indicator: string;
  operator: string;
  value: string;
}

interface StrategyFormProps {
  externalConditions?: Condition[];
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const inputClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]";
const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-2";
const selectClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer";

export default function StrategyForm({ externalConditions }: StrategyFormProps) {
  const router = useRouter();
  const { addStrategy, setBacktestResults } = useStore();

  const [strategyName, setStrategyName] = useState('ALPHAV1_MOMENTUM');
  const [coin, setCoin] = useState('BTC/USDT');
  const [coinSearch, setCoinSearch] = useState('');
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const coinDropdownRef = useRef<HTMLDivElement>(null);

  const [timeframe, setTimeframe] = useState('15m');
  const [backtestPeriod, setBacktestPeriod] = useState(180);
  const [stopLoss, setStopLoss] = useState('');
  const [tradeDuration, setTradeDuration] = useState('');
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [direction, setDirection] = useState<'long' | 'short' | 'auto'>('auto');
  const [conditions, setConditions] = useState<Condition[]>([
    { indicator: 'rsi', operator: '<', value: '30' },
    { indicator: 'ema', operator: '>', value: '200' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableIndicators, setAvailableIndicators] = useState<string[]>([]);
  const [coins, setCoins] = useState<string[]>(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);

  useEffect(() => {
    getAvailableIndicators()
      .then(res => setAvailableIndicators(res.indicators))
      .catch(console.error);
  }, []);

  useEffect(() => {
    getAvailableCoins()
      .then(r => setCoins(r.coins.map((c: string) => c.replace('USDT', '/USDT'))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (externalConditions && externalConditions.length > 0) {
      setConditions(externalConditions);
    }
  }, [externalConditions]);

  // Close coin dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (coinDropdownRef.current && !coinDropdownRef.current.contains(e.target as Node)) {
        setCoinDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCoins = coins.filter(c =>
    c.toLowerCase().includes(coinSearch.toLowerCase())
  );

  const handleAddCondition = () => {
    setConditions([...conditions, { indicator: availableIndicators[0] || 'rsi', operator: '<', value: '50' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleChangeCondition = (index: number, field: string, value: string) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const handleSubmit = async () => {
    if (!strategyName.trim()) {
      setError('Please enter a strategy name.');
      return;
    }
    if (conditions.length === 0) {
      setError('Please add at least one condition.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const strategy = {
        name: strategyName,
        coin,
        timeframe,
        backtest_period: backtestPeriod,
        stop_loss: stopLoss ? parseFloat(stopLoss) : 2,
        trade_duration: tradeDuration ? parseInt(tradeDuration) : 10,
        logic,
        direction,
        conditions: conditions.map(c => ({
          indicator: c.indicator,
          operator: c.operator === '<' ? 'less_than'
            : c.operator === '>' ? 'greater_than'
              : c.operator === 'crosses above' ? 'crosses_above'
                : c.operator === 'crosses below' ? 'crosses_below'
                  : 'greater_than',
          value: parseFloat(c.value) || 0,
        })),
      };
      const results = await runBacktest(strategy);
      setBacktestResults(results);
      addStrategy(strategy);
      router.push('/results');
    } catch (err) {
      setError('Failed to run backtest. Please check your settings and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-white font-bold text-2xl mb-4">Strategy Form</h2>

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 space-y-5">

        {/* Strategy Name */}
        <div>
          <label className={labelClass}>Strategy Name</label>
          <input
            type="text"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className={inputClass}
            placeholder="e.g. ALPHAV1_MOMENTUM"
          />
        </div>

        {/* Coin (searchable dropdown) + Timeframe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Coin</label>
            <div className="relative" ref={coinDropdownRef}>
              {/* Trigger button */}
              <button
                type="button"
                onClick={() => {
                  setCoinDropdownOpen(prev => !prev);
                  setCoinSearch('');
                }}
                className="w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors text-left flex items-center justify-between"
              >
                <span>{coin}</span>
                <span className="text-[#4B5563] text-xs">▼</span>
              </button>

              {/* Dropdown panel */}
              {coinDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-[#111111] border border-[#1F1F1F] rounded-lg shadow-xl overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-[#1F1F1F]">
                    <input
                      autoFocus
                      type="text"
                      value={coinSearch}
                      onChange={e => setCoinSearch(e.target.value)}
                      placeholder="Search coins..."
                      className="w-full bg-[#0D0D0D] border border-[#1F1F1F] text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]"
                    />
                  </div>
                  {/* Coin list */}
                  <ul className="max-h-48 overflow-y-auto">
                    {filteredCoins.length > 0 ? filteredCoins.map(c => (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => {
                            setCoin(c);
                            setCoinDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#1F1F1F] ${c === coin ? 'text-[#FACC15] font-semibold' : 'text-white'
                            }`}
                        >
                          {c}
                        </button>
                      </li>
                    )) : (
                      <li className="px-4 py-3 text-sm text-[#4B5563]">No coins found</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Timeframe</label>
            <div className="relative">
              <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className={selectClass}>
                {TIMEFRAMES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] text-xs">▼</span>
            </div>
          </div>
        </div>

        {/* Backtest Period slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass + ' mb-0'}>Backtest Period</label>
            <span className="text-[#FACC15] text-xs font-semibold uppercase tracking-widest">
              {backtestPeriod} Days
            </span>
          </div>
          <input
            type="range"
            min={7}
            max={365}
            value={backtestPeriod}
            onChange={(e) => setBacktestPeriod(parseInt(e.target.value))}
            className="w-full accent-[#FACC15] cursor-pointer"
          />
        </div>

        {/* Stop Loss + Trade Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Stop Loss %</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className={inputClass}
              placeholder="e.g. 2"
            />
          </div>
          <div>
            <label className={labelClass}>Trade Duration</label>
            <input
              type="number"
              value={tradeDuration}
              onChange={(e) => setTradeDuration(e.target.value)}
              className={inputClass}
              placeholder="candles"
            />
          </div>
        </div>

        {/* Direction toggle */}
        <div>
          <label className={labelClass}>Direction</label>
          <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-[#1F1F1F]">
            {(['long', 'auto', 'short'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${direction === d
                    ? d === 'long'
                      ? 'bg-emerald-500 text-black'
                      : d === 'short'
                        ? 'bg-rose-500 text-white'
                        : 'bg-[#FACC15] text-black'
                    : 'bg-[#111111] text-[#4B5563] hover:text-white'
                  }`}
              >
                {d === 'long' ? '▲ Bullish' : d === 'short' ? '▼ Bearish' : 'Auto'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#4B5563] mt-1.5 tracking-wide">
            {direction === 'auto'
              ? 'Direction inferred automatically from your conditions.'
              : `All signals will be forced ${direction === 'long' ? 'LONG (bullish)' : 'SHORT (bearish)'}.`}
          </p>
        </div>

        {/* Entry Logic toggle */}
        <div>
          <label className={labelClass}>Entry Logic</label>
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-[#1F1F1F]">
            <button
              onClick={() => setLogic('AND')}
              className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${logic === 'AND' ? 'bg-[#FACC15] text-black' : 'bg-[#111111] text-[#4B5563] hover:text-white'
                }`}
            >
              AND
            </button>
            <button
              onClick={() => setLogic('OR')}
              className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${logic === 'OR' ? 'bg-[#FACC15] text-black' : 'bg-[#111111] text-[#4B5563] hover:text-white'
                }`}
            >
              OR
            </button>
          </div>
        </div>

        {/* Conditions List */}
        <div>
          <label className={labelClass}>Conditions List</label>
          {conditions.map((condition, index) => (
            <ConditionCard
              key={index}
              index={index}
              indicator={condition.indicator}
              operator={condition.operator}
              value={condition.value}
              onRemove={() => handleRemoveCondition(index)}
              onChange={(field, value) => handleChangeCondition(index, field, value)}
              availableIndicators={availableIndicators}
            />
          ))}

          <button
            onClick={handleAddCondition}
            className="w-full border border-dashed border-[#1F1F1F] hover:border-[#FACC15] text-[#4B5563] hover:text-[#FACC15] rounded-lg py-3 text-sm font-medium uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-1"
          >
            <span className="text-lg leading-none">+</span>
            Add Condition
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full mt-5 bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Running Backtest...
          </>
        ) : (
          'Run Backtest'
        )}
      </button>
    </div>
  );
}