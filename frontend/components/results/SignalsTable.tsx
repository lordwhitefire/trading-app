'use client';

import React, { useState } from 'react';
import { chatWithResults } from '@/lib/api';

interface Props {
  results: any;
  timezone: string;
  onSelectSignal: (signal: any) => void;
}

const OUTCOME_STYLES: Record<string, string> = {
  'win': 'bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30',
  'loss': 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30',
  'expired-win': 'bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]/30',
  'expired-loss': 'bg-orange-900/20 text-orange-400 border-orange-700/30',
};

export default function SignalsTable({ results, timezone, onSelectSignal }: Props) {
  const [selected, setSelected] = useState<any>(null);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-GB', {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const handleRowClick = (signal: any) => {
    setSelected(signal);
    setAiAnswer('');
    onSelectSignal(signal);
  };

  const handleExplain = async () => {
    if (!selected) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const res = await chatWithResults(
        'Explain this trade signal in plain English. Why did it trigger? What happened during the trade? What does the outcome mean?',
        results,
        selected
      );
      setAiAnswer(res.answer);
    } catch (e) {
      setAiAnswer('Failed to get AI explanation. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F1F1F]">
              {['Date', 'Coin', 'Dir', 'Entry', 'Exit', 'SL', 'TP', 'Outcome', 'Duration', 'PnL %'].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] px-3 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.signals.map((signal: any, i: number) => (
              <tr
                key={i}
                onClick={() => handleRowClick(signal)}
                className={`border-b border-[#1F1F1F] hover:bg-[#111111] cursor-pointer transition-colors ${selected === signal ? 'bg-[#111111] border-l-2 border-l-[#FACC15]' : ''
                  }`}
              >
                <td className="px-3 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">
                  {formatDate(signal.date)}
                </td>
                <td className="px-3 py-3 text-white font-medium">{signal.coin}</td>
                <td className="px-3 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${signal.direction === 'long'
                      ? 'bg-[#22C55E]/20 text-[#22C55E]'
                      : 'bg-[#EF4444]/20 text-[#EF4444]'
                    }`}>
                    {signal.direction?.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-3 text-white font-mono text-xs">
                  ${signal.entry_price?.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-white font-mono text-xs">
                  ${signal.exit_price?.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-[#EF4444] font-mono text-xs">
                  ${signal.stop_loss_price?.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-[#22C55E] font-mono text-xs">
                  ${signal.take_profit_price?.toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${OUTCOME_STYLES[signal.outcome] || 'text-[#9CA3AF]'}`}>
                    {signal.outcome}
                  </span>
                </td>
                <td className="px-3 py-3 text-[#9CA3AF] font-mono text-xs">
                  {signal.duration_candles}c
                </td>
                <td className={`px-3 py-3 font-mono text-xs font-bold ${signal.pnl_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  {signal.pnl_pct >= 0 ? '+' : ''}{signal.pnl_pct?.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signal detail drawer */}
      {selected && (
        <div className="mt-6 bg-[#111111] border border-[#FACC15]/30 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base">Signal Detail</h3>
              <p className="text-[#4B5563] text-xs mt-1">{formatDate(selected.date)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExplain}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-[#FACC15]/20 transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Explaining...
                  </>
                ) : '✨ Explain this signal'}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="text-[#4B5563] hover:text-white px-3 py-2 text-xs transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-4">
            {[
              { label: 'Direction', value: selected.direction?.toUpperCase(), color: selected.direction === 'long' ? 'text-[#22C55E]' : 'text-[#EF4444]' },
              { label: 'Entry Price', value: `$${selected.entry_price?.toLocaleString()}`, color: 'text-white' },
              { label: 'Exit Price', value: `$${selected.exit_price?.toLocaleString()}`, color: 'text-white' },
              { label: 'Stop Loss', value: `$${selected.stop_loss_price?.toLocaleString()}`, color: 'text-[#EF4444]' },
              { label: 'Take Profit', value: `$${selected.take_profit_price?.toLocaleString()}`, color: 'text-[#22C55E]' },
              { label: 'Outcome', value: selected.outcome, color: selected.pnl_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]' },
              { label: 'Duration', value: `${selected.duration_candles} candles`, color: 'text-[#9CA3AF]' },
              { label: 'PnL %', value: `${selected.pnl_pct >= 0 ? '+' : ''}${selected.pnl_pct?.toFixed(2)}%`, color: selected.pnl_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]' },
              { label: 'PnL USD', value: `${selected.pnl_usd >= 0 ? '+' : ''}$${selected.pnl_usd?.toFixed(2)}`, color: selected.pnl_usd >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]' },
            ].map(item => (
              <div key={item.label} className="bg-[#0D0D0D] rounded-lg p-3">
                <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">{item.label}</p>
                <p className={`font-mono font-bold text-sm ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Conditions */}
          {selected.conditions_met?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-2">Conditions Triggered</p>
              <div className="flex flex-wrap gap-2">
                {selected.conditions_met.map((c: string, i: number) => (
                  <span key={i} className="bg-[#0D0D0D] border border-[#1F1F1F] text-[#9CA3AF] text-xs px-2 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI explanation */}
          {aiAnswer && (
            <div className="bg-[#0D0D0D] border border-[#FACC15]/20 rounded-lg p-4 mt-2">
              <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-2">✨ AI Explanation</p>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">{aiAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}