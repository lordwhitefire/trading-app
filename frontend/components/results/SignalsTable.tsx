'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function SignalsTable() {
  const { backtestResults } = useStore();

  if (!backtestResults) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold text-white px-1">Trade Signals</h2>
        <div className="bg-surface border border-border p-8 text-center rounded">
          <p className="text-text-muted text-sm uppercase tracking-widest">No backtest results yet</p>
        </div>
      </section>
    );
  }

  const signals = backtestResults.signals ?? [];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-white px-1">Trade Signals</h2>
      <div className="overflow-x-auto bg-surface border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {['Date', 'Coin', 'Outcome', 'PnL %'].map((col) => (
                <th
                  key={col}
                  className={`px-4 py-3 text-[12px] font-semibold uppercase tracking-wider text-text-secondary ${col === 'PnL %' ? 'text-right' : ''}`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {signals.map((signal: any, index: number) => (
              <tr key={index} className="hover:bg-surface-elevated transition-colors">
                <td className="px-4 py-4 text-sm text-text-secondary font-mono">{signal.date}</td>
                <td className="px-4 py-4 text-sm font-bold text-white">{signal.coin}/USDT</td>
                <td className="px-4 py-4">
                  {signal.outcome === 'win' ? (
                    <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full border border-success/20 font-bold uppercase">WIN</span>
                  ) : (
                    <span className="bg-danger/10 text-danger text-[10px] px-2 py-0.5 rounded-full border border-danger/20 font-bold uppercase">LOSS</span>
                  )}
                </td>
                <td className={`px-4 py-4 text-right font-mono text-sm font-medium ${signal.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {signal.pnl >= 0 ? '+' : ''}{signal.pnl?.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {signals.length === 0 && (
        <div className="bg-surface border border-border p-6 text-center">
          <p className="text-text-muted text-xs uppercase tracking-widest">No signals generated</p>
        </div>
      )}
    </section>
  );
}
