'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function SignalsTable({ results }) {
  const { backtestResults } = useStore();

  if (!backtestResults) return <div>Loading...</div>;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th>Date</th>
          <th>Coin</th>
          <th>Price</th>
          <th>Conditions</th>
          <th>Outcome</th>
          <th>Duration</th>
          <th>PnL</th>
        </tr>
      </thead>
      <tbody>
        {backtestResults.signals.map((signal, index) => (
          <tr key={index}>
            <td>{signal.date}</td>
            <td>{signal.coin}</td>
            <td>${signal.price.toFixed(2)}</td>
            <td>{signal.conditions.join(', ')}</td>
            <td className={`text-center ${signal.outcome === 'win' ? 'text-green-500' : 'text-red-500'}`}>
              {signal.outcome}
            </td>
            <td>{signal.duration} days</td>
            <td className={`text-center ${signal.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${signal.pnl.toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
