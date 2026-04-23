import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">AlphaDesk</h1>
      <p className="mt-4 text-lg">Build, backtest and analyze trading strategies with AI</p>
      <div className="mt-8 space-x-4">
        <Link href="/builder" className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Build a Strategy
        </Link>
        <Link href="/live" className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">
          View Live Signals
        </Link>
      </div>
    </div>
  );
}
