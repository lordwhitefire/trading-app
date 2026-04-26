'use client';

import React from 'react';

interface Props {
  results: any;
}

export default function SummaryCards({ results }: Props) {
  const cards = [
    {
      label: 'Total Signals',
      value: results.total_signals,
      format: (v: number) => v.toString(),
      color: 'text-white',
    },
    {
      label: 'Win Rate',
      value: results.win_rate,
      format: (v: number) => `${v.toFixed(1)}%`,
      color: results.win_rate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Total Return',
      value: results.total_return_pct,
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
      color: results.total_return_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Avg PnL / Trade',
      value: results.avg_pnl_pct,
      format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`,
      color: results.avg_pnl_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]',
    },
    {
      label: 'Max Drawdown',
      value: results.max_drawdown_pct,
      format: (v: number) => `-${v.toFixed(2)}%`,
      color: 'text-[#EF4444]',
    },
    {
      label: 'Backtest Candles',
      value: results.backtest_period,
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