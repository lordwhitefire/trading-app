'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SummaryCards from '@/components/results/SummaryCards';
import EquityCurve from '@/components/results/TradeChart';
import OutcomeBreakdown from '@/components/results/OutcomeBreakdown';
import TimeHeatmap from '@/components/results/TimeHeatmap';
import SignalsTable from '@/components/results/SignalsTable';
import AIAnalysisPanel from '@/components/shared/AIExplanationPanel';
import DownloadReport from '@/components/results/DownloadReport';

const TIMEZONES = [
  { label: 'WAT — West Africa Time (UTC+1)', value: 'Africa/Lagos' },
  { label: 'GMT — Greenwich Mean Time (UTC+0)', value: 'UTC' },
  { label: 'EST — Eastern Standard Time (UTC-5)', value: 'America/New_York' },
  { label: 'CET — Central European Time (UTC+1)', value: 'Europe/Berlin' },
  { label: 'IST — India Standard Time (UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'SGT — Singapore Time (UTC+8)', value: 'Asia/Singapore' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * True when the backend returned a multi-coin payload.
 * Handles both boolean true and string "true" just in case serialisation varies.
 */
function isMultiCoin(r: any): boolean {
  return (r?.multi_coin === true || r?.multi_coin === 'true') && r?.results != null;
}

/**
 * Per-coin summary for the tab bar.
 * Uses the EXACT field names from BacktestResult (backend/models/signal.py):
 *   total_signals, wins, expired_wins, total_return_pct
 */
function coinSummary(result: any) {
  const total = result?.total_signals ?? 0;
  const wins = (result?.wins ?? 0) + (result?.expired_wins ?? 0);
  const wr = total > 0 ? ((wins / total) * 100).toFixed(0) : '—';
  const pnl = result?.total_return_pct ?? 0;
  return { total, winRate: wr, pnl };
}

// ─── Coin tab bar ─────────────────────────────────────────────────────────────
function CoinTabs({
  coins, active, results, errors, onChange,
}: {
  coins: string[];
  active: string;
  results: Record<string, any>;
  errors: Record<string, string>;
  onChange: (coin: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {coins.map(coin => {
        const hasError = !!errors[coin];
        const summary = results[coin] ? coinSummary(results[coin]) : null;
        const isActive = coin === active;

        return (
          <button
            key={coin}
            onClick={() => !hasError && onChange(coin)}
            disabled={hasError}
            className={`flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all
              ${hasError
                ? 'border-red-500/30 bg-red-900/10 opacity-50 cursor-not-allowed'
                : isActive
                  ? 'border-[#FACC15] bg-[#FACC15]/10'
                  : 'border-[#1F1F1F] bg-[#0D0D0D] hover:border-[#FACC15]/40'
              }`}
          >
            <span className={`text-sm font-bold ${isActive ? 'text-[#FACC15]' : 'text-white'}`}>
              {coin}
            </span>
            {hasError ? (
              <span className="text-[10px] text-red-400 mt-0.5">Failed</span>
            ) : summary ? (
              <span className="text-[10px] text-[#4B5563] mt-0.5 font-mono">
                {summary.total} trades · {summary.winRate}% WR ·{' '}
                <span className={Number(summary.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {Number(summary.pnl) >= 0 ? '+' : ''}{Number(summary.pnl).toFixed(1)}%
                </span>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

// ─── Single coin results view (reused for both single and multi) ──────────────
function SingleCoinResults({
  results,
  timezone,
  selectedSignal,
  onSelectSignal,
}: {
  results: any;
  timezone: string;
  selectedSignal: any;
  onSelectSignal: (s: any) => void;
}) {
  return (
    <div className="space-y-8">
      <SummaryCards results={results} />

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-6">📈 Equity Curve</h2>
        <EquityCurve results={results} timezone={timezone} />
      </div>

      <OutcomeBreakdown results={results} />

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-2">🕐 Signal Time Analysis</h2>
        <p className="text-[#4B5563] text-sm mb-6">
          When are signals generated? Hover on any point to see details.
        </p>
        <TimeHeatmap results={results} timezone={timezone} />
      </div>

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
        <h2 className="text-white font-bold text-lg mb-6">📋 Trade Signals</h2>
        <SignalsTable
          results={results}
          timezone={timezone}
          onSelectSignal={onSelectSignal}
        />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { backtestResults } = useStore();
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [activeCoin, setActiveCoin] = useState<string>('');

  // ── Detect multi-coin and derive active coin default ──────────────────────
  const multi = isMultiCoin(backtestResults);

  const coins: string[] = multi ? backtestResults.coins : [];
  const coinResults: Record<string, any> = multi ? backtestResults.results : {};
  const coinErrors: Record<string, string> = multi ? (backtestResults.errors ?? {}) : {};

  // Active coin defaults to first successful coin
  const resolvedActive = useMemo(() => {
    if (!multi) return '';
    if (activeCoin && coinResults[activeCoin]) return activeCoin;
    return coins.find(c => !coinErrors[c]) ?? coins[0] ?? '';
  }, [multi, activeCoin, coins, coinResults, coinErrors]);

  // The result object to display — always an individual BacktestResult dict
  const displayResults = multi ? coinResults[resolvedActive] : backtestResults;

  // For AI panel in multi-coin mode, pass all results together
  const aiResults = backtestResults;

  // ── No results ──────────────────────────────────────────────────────────
  if (!backtestResults) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 flex flex-col items-center justify-center">
        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-16 text-center max-w-md">
          <div className="text-4xl mb-4">📊</div>
          <h2 className="text-white font-bold text-xl mb-3">No Results Yet</h2>
          <p className="text-[#4B5563] text-sm mb-6">
            Run a backtest in the Builder to see your results here.
          </p>
          <Link href="/builder"
            className="bg-[#FACC15] text-black font-bold px-6 py-3 rounded-lg uppercase tracking-widest text-sm hover:bg-[#FDE047] transition-colors">
            → Go to Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8 pb-32 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-white font-black text-3xl uppercase tracking-tight">
            Backtest <span className="text-[#FACC15]">Results</span>
          </h1>
          <p className="text-[#4B5563] text-sm mt-1">
            {multi
              ? `${coins.length} coins · ${backtestResults.coins?.join(', ')}`
              : `${backtestResults.strategy_name} · ${backtestResults.coin} · ${backtestResults.timeframe}`
            }
          </p>
        </div>

        {/* Timezone selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">Timezone</span>
          <select value={timezone} onChange={e => setTimezone(e.target.value)}
            className="bg-[#111111] border border-[#1F1F1F] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer">
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>
      {/* 2. Add to the header section (next to the timezone selector)*/}
      <DownloadReport
        results={backtestResults}
        isMultiCoin={multi}
        coins={multi ? coins : undefined}
      />
      {/* ── Multi-coin: coin tab bar ── */}
      {multi && (
        <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
          <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-3">
            Select Coin to View
          </p>
          <CoinTabs
            coins={coins}
            active={resolvedActive}
            results={coinResults}
            errors={coinErrors}
            onChange={coin => { setActiveCoin(coin); setSelectedSignal(null); }}
          />

          {/* Partial error notice */}
          {Object.keys(coinErrors).length > 0 && (
            <div className="mt-3 bg-red-900/10 border border-red-500/20 rounded-lg px-4 py-2">
              <p className="text-red-400 text-xs">
                {Object.keys(coinErrors).length} coin(s) failed:{' '}
                {Object.entries(coinErrors).map(([c, e]) => `${c} (${e})`).join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Results for active coin ── */}
      {displayResults ? (
        <SingleCoinResults
          results={displayResults}
          timezone={timezone}
          selectedSignal={selectedSignal}
          onSelectSignal={setSelectedSignal}
        />
      ) : (
        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-10 text-center">
          <p className="text-[#4B5563] text-sm">No results available for {resolvedActive}</p>
        </div>
      )}

      {/* ── AI Analysis — gets all coin data in multi-coin mode ── */}
      <AIAnalysisPanel
        results={aiResults}
        selectedSignal={selectedSignal}
        isMultiCoin={multi}
        coins={multi ? coins : undefined}
      />

    </div>
  );
}