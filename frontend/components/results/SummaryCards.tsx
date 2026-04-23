'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function SummaryCards() {
  const { backtestResults } = useStore();

  if (!backtestResults) {
    return (
      <section className="grid grid-cols-2 gap-4">
        {['Total Signals', 'Win Rate', 'Total Return', 'Avg PnL'].map((label) => (
          <div key={label} className="bg-surface border border-border p-4 flex flex-col gap-1 animate-pulse">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-text-secondary">{label}</span>
            <div className="h-8 bg-border rounded w-24 mt-1" />
          </div>
        ))}
      </section>
    );
  }

  const totalSignals = backtestResults.total_signals ?? 0;
  const winRate = backtestResults.win_rate?.toFixed(1) ?? '0.0';
  const totalReturn = backtestResults.total_return?.toFixed(1) ?? '0.0';
  const avgPnl = backtestResults.avg_pnl?.toFixed(2) ?? '0.00';

  const cards = [
    { label: 'Total Signals', value: totalSignals.toLocaleString(), color: 'text-text-primary' },
    { label: 'Win Rate', value: `${winRate}%`, color: parseFloat(winRate) >= 50 ? 'text-success' : 'text-danger' },
    { label: 'Total Return', value: `${parseFloat(totalReturn) >= 0 ? '+' : ''}${totalReturn}%`, color: parseFloat(totalReturn) >= 0 ? 'text-success' : 'text-danger' },
    { label: 'Avg PnL', value: `${parseFloat(avgPnl) >= 0 ? '+' : ''}${avgPnl}%`, color: parseFloat(avgPnl) >= 0 ? 'text-success' : 'text-danger' },
  ];

  return (
    <section className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-border p-4 flex flex-col gap-1 transition-all duration-300 hover:border-border-hover"
        >
          <span className="text-[12px] font-semibold uppercase tracking-widest text-text-secondary">{card.label}</span>
          <span className={`font-mono text-3xl font-normal ${card.color}`}>{card.value}</span>
        </div>
      ))}
    </section>
  );
}
