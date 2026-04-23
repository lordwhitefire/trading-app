'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function SummaryCards({ results }) {
  const { backtestResults } = useStore();

  if (!backtestResults) return <div>Loading...</div>;

  const totalSignals = backtestResults.signals.length;
  const winRate = (backtestResults.wins / totalSignals * 100).toFixed(2);
  const totalReturn = backtestResults.total_return.toFixed(2);
  const averagePnl = backtestResults.average_pnl.toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={`bg-gray-800 p-4 rounded text-center ${winRate > 50 ? 'text-green-500' : 'text-red-500'}`}>
        <h3>Total Signals</h3>
        <p>{totalSignals}</p>
      </div>
      <div className={`bg-gray-800 p-4 rounded text-center ${winRate > 50 ? 'text-green-500' : 'text-red-500'}`}>
        <h3>Win Rate</h3>
        <p>{winRate}%</p>
      </div>
      <div className="bg-gray-800 p-4 rounded text-center">
        <h3>Total Return</h3>
        <p>${totalReturn}</p>
      </div>
      <div className={`bg-gray-800 p-4 rounded text-center ${averagePnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
        <h3>Average PnL</h3>
        <p>${averagePnl}</p>
      </div>
    </div>
  );
}
