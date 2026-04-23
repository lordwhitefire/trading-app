'use client';

import React, { useState } from 'react';
import { runBacktest } from '@/lib/api';
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

const COINS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT', 'AVAX/USDT'];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const inputClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]";
const selectClass = "w-full bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer";
const labelClass = "block text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-2";

export default function StrategyForm({ externalConditions }: StrategyFormProps) {
  const router = useRouter();
  const { addStrategy, setBacktestResults } = useStore();

  const [strategyName, setStrategyName] = useState('ALPHAV1_MOMENTUM');
  const [coin, setCoin] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [backtestPeriod, setBacktestPeriod] = useState(180);
  const [stopLoss, setStopLoss] = useState('');
  const [tradeDuration, setTradeDuration] = useState('');
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([
    { indicator: 'RSI', operator: '<', value: '30' },
    { indicator: 'EMA 200', operator: '>', value: 'Current Price' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Merge external conditions from AI translator if provided
  React.useEffect(() => {
    if (externalConditions && externalConditions.length > 0) {
      setConditions(externalConditions);
    }
  }, [externalConditions]);

  const handleAddCondition = () => {
    setConditions([...conditions, { indicator: 'RSI', operator: '<', value: '50' }]);
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
        backtestPeriod,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        tradeDuration: tradeDuration ? parseInt(tradeDuration) : null,
        logic,
        conditions,
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

        {/* Coin + Timeframe */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Coin</label>
            <div className="relative">
              <select value={coin} onChange={(e) => setCoin(e.target.value)} className={selectClass}>
                {COINS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] text-xs">▼</span>
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

        {/* Entry Logic toggle */}
        <div>
          <label className={labelClass}>Entry Logic</label>
          <div className="grid grid-cols-2 rounded-lg overflow-hidden border border-[#1F1F1F]">
            <button
              onClick={() => setLogic('AND')}
              className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${logic === 'AND'
                  ? 'bg-[#FACC15] text-black'
                  : 'bg-[#111111] text-[#4B5563] hover:text-white'
                }`}
            >
              AND
            </button>
            <button
              onClick={() => setLogic('OR')}
              className={`py-3 text-sm font-bold uppercase tracking-widest transition-colors ${logic === 'OR'
                  ? 'bg-[#FACC15] text-black'
                  : 'bg-[#111111] text-[#4B5563] hover:text-white'
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
            />
          ))}

          {/* Add Condition button */}
          <button
            onClick={handleAddCondition}
            className="w-full border border-dashed border-[#1F1F1F] hover:border-[#FACC15] text-[#4B5563] hover:text-[#FACC15] rounded-lg py-3 text-sm font-medium uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-1"
          >
            <span className="text-lg leading-none">+</span>
            Add Condition
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Run Backtest */}
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