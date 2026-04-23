'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function SignalCard({ signal }) {
  const { backtestResults } = useStore();

  if (!signal) return <div>Loading...</div>;

  const confidenceScore = (backtestResults[signal.strategy].signals.find(s => s.time === signal.time)?.confidence_score || 0) * 100;

  return (
    <div className="bg-gray-800 p-4 rounded mb-2 flex items-center justify-between">
      <div>
        <p>Coin: {signal.coin}</p>
        <p>Price: ${signal.price.toFixed(2)}</p>
        <p>Time: {signal.time.toLocaleString()}</p>
        <p>Conditions Triggered: {signal.conditions_triggered.join(', ')}</p>
      </div>
      <div className="bg-green-500 text-white px-4 py-2 rounded">
        Confidence Score: {confidenceScore.toFixed(2)}%
      </div>
    </div>
  );
}
