'use client';

import React from 'react';
import SummaryCards from '@/components/results/SummaryCards';
import TradeChart from '@/components/results/TradeChart';
import SignalsTable from '@/components/results/SignalsTable';
import Footer from '@/components/shared/Footer';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function ResultsPage() {
  const { backtestResults } = useStore();

  if (!backtestResults) {
    return (
      <>
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
          <div className="border border-dashed border-border rounded-xl p-16 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-text-muted text-4xl">analytics</span>
            <p className="text-text-muted text-sm uppercase tracking-widest">No backtest results yet</p>
            <p className="text-text-secondary text-xs">Run a backtest in the Builder to see results here</p>
            <Link
              href="/builder"
              className="mt-2 text-accent text-sm font-bold uppercase tracking-widest hover:text-accent-hover transition-colors flex items-center gap-1"
            >
              → Go to Builder
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col gap-8">
        <SummaryCards />
        <TradeChart />
        <SignalsTable />
      </div>
      <Footer />
    </>
  );
}
