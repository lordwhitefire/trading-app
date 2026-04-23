import React from 'react';
import { useStore } from '@/lib/store';
import SummaryCards from '@/components/results/SummaryCards';
import MonthlyChart from '@/components/results/MonthlyChart';
import TimeHeatmap from '@/components/results/TimeHeatmap';
import SignalsTable from '@/components/results/SignalsTable';

export default function ResultsPage() {
  const { backtestResults } = useStore();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Backtest Results</h1>
      <SummaryCards results={backtestResults} />
      <MonthlyChart results={backtestResults} />
      <TimeHeatmap results={backtestResults} />
      <SignalsTable results={backtestResults} />
    </div>
  );
}
