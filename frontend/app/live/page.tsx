import React from 'react';
import SignalCard from '@/components/live/SignalCard';
import NewsPanel from '@/components/live/NewsPanel';
import ETFPanel from '@/components/live/ETFPanel';

export default function LivePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Live Signals Dashboard</h1>
      <SignalCard />
      <NewsPanel />
      <ETFPanel />
    </div>
  );
}
