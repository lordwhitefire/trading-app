'use client';

import React from 'react';

interface Signal {
  coin: string;
  direction: 'LONG' | 'SHORT';
  entryPrice: number;
  confidence: number;
  timestamp: string;
}

export default function SignalCard({ signal }: { signal: Signal }) {
  const isLong = signal.direction === 'LONG';

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4 mb-3">
      {/* Top row: coin + direction + timestamp */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-[#1F1F1F] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {signal.coin}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isLong
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
            {signal.direction}
          </span>
        </div>
        <span className="text-[#4B5563] text-xs font-mono">{signal.timestamp}</span>
      </div>

      {/* Bottom row: entry price + confidence */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-1">
            Entry Price
          </p>
          <p className="text-white font-mono text-2xl font-light tracking-tight">
            ${signal.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-1">
            Confidence
          </p>
          <p className="text-[#FACC15] font-mono text-lg font-semibold">
            {signal.confidence}%
          </p>
        </div>
      </div>
    </div>
  );
}