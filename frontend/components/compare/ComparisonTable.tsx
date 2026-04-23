'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function ComparisonTable() {
  const { strategies, backtestResults } = useStore();

  if (!strategies || !backtestResults) return <div>Loading...</div>;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th>Strategy</th>
          <th>Win Rate</th>
          <th>Total Signals</th>
          <th>Total Return</th>
        </tr>
      </thead>
      <tbody>
        {strategies.map((strategy, index) => (
          <tr key={index}>
            <td>{strategy.name}</td>
            <td className={`text-center ${backtestResults[strategy.name].win_rate > 50 ? 'text-green-500' : 'text-red-500'}`}>
              {backtestResults[strategy.name].win_rate.toFixed(2)}%
            </td>
            <td>{backtestResults[strategy.name].total_signals}</td>
            <td>${backtestResults[strategy.name].total_return.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
