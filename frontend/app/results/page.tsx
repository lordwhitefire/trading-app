'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SummaryCards from '@/components/results/SummaryCards';
import EquityCurve from '@/components/results/TradeChart';
import OutcomeBreakdown from '@/components/results/OutcomeBreakdown';
import TimeHeatmap from '@/components/results/TimeHeatmap';
import SignalsTable from '@/components/results/SignalsTable';
import AIAnalysisPanel from '@/components/shared/AIExplanationPanel';

const TIMEZONES = [
  { label: 'WAT — West Africa Time (UTC+1)', value: 'Africa/Lagos' },
  { label: 'GMT — Greenwich Mean Time (UTC+0)', value: 'UTC' },
  { label: 'EST — Eastern Standard Time (UTC-5)', value: 'America/New_York' },
  { label: 'CET — Central European Time (UTC+1)', value: 'Europe/Berlin' },
  { label: 'IST — India Standard Time (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'SGT — Singapore Time (UTC+8)', value: 'Asia/Singapore' },
];

export default function ResultsPage() {
  const { backtestResults } = useStore();
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [selectedSignal, setSelectedSignal] = useState<any>(null);

  if (!backtestResults) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 flex flex-col items-center justify-center">
        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-16 text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-white font-bold text-xl mb-3">No Results Yet</h2>
          <p className="text-[#4B5563] text-sm mb-6">
            Run a backtest in the Builder to see your results here.
          </p>
          <Link
            href="/builder"
            className="bg-[#FACC15] text-black font-bold px-6 py-3 rounded-lg uppercase tracking-widest text-sm hover:bg-[#FDE047] transition-colors"
          >
            → Go to Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 pb-32 space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-white font-black text-3xl uppercase tracking-tight">
            Backtest <span className="text-[#FACC15]">Results</span>
          </h1>
          <p className="text-[#4B5563] text-sm mt-1">
            {backtestResults.strategy_name} · {backtestResults.coin} · {backtestResults.timeframe}
          </p>
        </div>

        {/* Timezone selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">Timezone</span>
          <select
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="bg-[#111111] border border-[#1F1F1F] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer"
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 1 — Summary Cards */}
      <SummaryCards results={backtestResults} />

      {/* Section 2 — Equity Curve */}
      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-6">📈 Equity Curve</h2>
        <EquityCurve results={backtestResults} timezone={timezone} />
      </div>

      {/* Section 3 — Outcome Breakdown */}
      <OutcomeBreakdown results={backtestResults} />

      {/* Section 4 — Time Heatmap */}
      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-2">🕐 Signal Time Analysis</h2>
        <p className="text-[#4B5563] text-sm mb-6">
          When are signals generated? Hover on any point to see details.
        </p>
        <TimeHeatmap results={backtestResults} timezone={timezone} />
      </div>

      {/* Section 5 — Signals Table */}
      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-6">📋 Trade Signals</h2>
        <SignalsTable
          results={backtestResults}
          timezone={timezone}
          onSelectSignal={setSelectedSignal}
        />
      </div>

      {/* Section 6 — AI Analysis Panel */}
      <AIAnalysisPanel
        results={backtestResults}
        selectedSignal={selectedSignal}
      />

    </div>
  );
}