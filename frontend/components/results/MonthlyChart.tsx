'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useStore } from '@/lib/store';

export default function MonthlyChart({ results }) {
  const { backtestResults } = useStore();

  if (!backtestResults) return <div>Loading...</div>;

  const data = backtestResults.signals.map((signal, index) => ({
    month: `Month ${index + 1}`,
    wins: signal.wins,
    losses: signal.losses
  }));

  return (
    <BarChart width={500} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar name="Wins" dataKey="wins" fill="#4caf50" />
      <Bar name="Losses" dataKey="losses" fill="#f44336" />
    </BarChart>
  );
}
