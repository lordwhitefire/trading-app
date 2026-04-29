'use client';

import React from 'react';

interface Props {
  results: any;
}

export default function SummaryCards({ results }: Props) {
  // ── Safe accessors — never crash even if a field is undefined ────────────
  const totalSignals = results?.total_signals ?? 0;
  const winRate = results?.win_rate ?? 0;
  const totalReturnPct = results?.total_return_pct ?? 0;
  const avgPnlPct = results?.avg_pnl_pct ?? 0;
  const maxDrawdown = results?.max_drawdown_pct ?? 0;
  const backtestPeriod = results?.backtest_period ?? 0;

  const cards = [
    {
      label: 'Total Signals',
      value: totalSignals,
      format: (v: number) => v.toString(),
      color: 'text-white',
    },
    {
      label: 'Win Rate',
      value: winRate,
      format: (v: number) => `${v.toFixed(1)}%`,
      color: winRate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Total Return',
      value: totalReturnPct,
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
      color: totalReturnPct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Avg PnL / Trade',
      value: avgPnlPct,
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
      color: avgPnlPct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Max Drawdown',
      value: maxDrawdown,
      format: (v: number) => `-${v.toFixed(2)}%`,
      color: 'text-[#EF4444]',
    },
    {
      label: 'Backtest Candles',
      value: backtestPeriod,
      format: (v: number) => v.toString(),
      color: 'text-[#9CA3AF]',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-5"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-3">
            {card.label}
          </p>
          <p className={`text-2xl font-mono font-bold ${card.color}`}>
            {card.format(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}