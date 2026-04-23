import React from 'react';
import ComparisonTable from '@/components/compare/ComparisonTable';
import CorrelationPanel from '@/components/compare/CorrelationPanel';

export default function ComparePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Strategy Comparison</h1>
      <ComparisonTable />
      <CorrelationPanel />
    </div>
  );
}
