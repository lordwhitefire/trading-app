'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function CorrelationPanel() {
  const { strategies, backtestResults } = useStore();

  if (!strategies || !backtestResults) return <div>Loading...</div>;

  const overlappingSignals = strategies.filter(strategy => {
    for (const otherStrategy of strategies) {
      if (strategy.name !== otherStrategy.name && JSON.stringify(backtestResults[strategy.name].signals) === JSON.stringify(backtestResults[otherStrategy.name].signals)) {
        return true;
      }
    }
    return false;
  });

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2>Correlation Panel</h2>
      {overlappingSignals.length > 0 ? (
        <div>
          <p>The following strategies have overlapping signals:</p>
          <ul>
            {overlappingSignals.map((strategy, index) => (
              <li key={index}>{strategy.name}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No overlapping signals found.</p>
      )}
    </div>
  );
}
