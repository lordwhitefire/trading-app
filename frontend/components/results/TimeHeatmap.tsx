'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function TimeHeatmap({ results }) {
  const { backtestResults } = useStore();

  if (!backtestResults) return <div>Loading...</div>;

  const data = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let day = 0; day < 7; day++) {
      const pnl = backtestResults.signals.find(signal => signal.time.getHours() === hour && signal.time.getDay() === day)?.pnl || 0;
      data.push({ hour, day, pnl });
    }
  }

  return (
    <div className="grid grid-cols-24 gap-1">
      {data.map((item, index) => (
        <div key={index} className={`bg-gray-800 p-1 text-center ${item.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {item.hour}:{item.day}
        </div>
      ))}
    </div>
  );
}
