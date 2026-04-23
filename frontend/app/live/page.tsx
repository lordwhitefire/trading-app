'use client';

import React, { useEffect, useState } from 'react';
import SignalCard from '@/components/live/SignalCard';
import NewsPanel from '@/components/live/NewsPanel';
import ETFPanel from '@/components/live/ETFPanel';

const MOCK_SIGNALS = [
  { coin: 'BTC/USDT', direction: 'LONG' as const, entryPrice: 64231.50, confidence: 94.2, timestamp: '14:20:45' },
  { coin: 'ETH/USDT', direction: 'SHORT' as const, entryPrice: 3452.12, confidence: 88.5, timestamp: '14:18:22' },
  { coin: 'SOL/USDT', direction: 'LONG' as const, entryPrice: 145.88, confidence: 76.1, timestamp: '14:05:10' },
];

export default function LivePage() {
  const [signals, setSignals] = useState(MOCK_SIGNALS);
  const [countdown, setCountdown] = useState(5);

  // Auto-refresh countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Reset countdown (real refresh logic would go here)
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">

      {/* Live Signals Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-white font-black text-3xl uppercase tracking-tight flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          Live Signals
        </h1>
        <span className="text-[#4B5563] text-xs font-mono uppercase tracking-widest">
          Auto-Refresh: {countdown}s
        </span>
      </div>

      {/* Signal Cards */}
      <div className="mb-8">
        {signals.map((signal, index) => (
          <SignalCard key={index} signal={signal} />
        ))}
      </div>

      {/* Market News */}
      <NewsPanel />

      {/* ETF Flow Tracker */}
      <ETFPanel />

      {/* Footer */}
      <footer className="border-t border-[#1F1F1F] py-8 text-center mt-4">
        <p className="text-[10px] tracking-widest uppercase text-white/40 mb-4">
          © 2024 AlphaDesk Terminal. Institutional Grade Strategy Builder.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          {['Documentation', 'API Reference'].map((l) => (
            <a key={l} href="#" className="text-[10px] tracking-widest uppercase text-white/40 hover:text-[#FACC15] transition-colors">
              {l}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}