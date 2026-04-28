'use client';

import React from 'react';

interface Signal {
  coin: string;
  direction: string;
  entry_price?: number;
  entryPrice?: number;
  confidence?: number;
  confidence_score?: number;
  timestamp?: string;
  time?: string;
  stop_loss_price?: number;
  take_profit_price?: number;
  conditions_triggered?: string[];
}

export default function SignalCard({ signal }: { signal: Signal }) {
  const direction = (signal.direction || 'LONG').toUpperCase();
  const isLong = direction === 'LONG';
  const entryPrice = signal.entry_price || signal.entryPrice || 0;
  const confidence = signal.confidence || signal.confidence_score || 0;
  const timestamp = signal.timestamp || signal.time || '';

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4 mb-3 hover:border-[#2E2E2E] transition-colors">

      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-[#1F1F1F] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {signal.coin}
          </span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isLong
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
            {isLong ? '↑ LONG' : '↓ SHORT'}
          </span>
        </div>
        <span className="text-[#4B5563] text-xs font-mono">{timestamp}</span>
      </div>

      {/* Prices row */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-1">Entry Price</p>
          <p className="text-white font-mono text-2xl font-light tracking-tight">
            ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-1">Confidence</p>
          <p className="text-[#FACC15] font-mono text-lg font-semibold">
            {typeof confidence === 'number' ? confidence.toFixed(1) : confidence}%
          </p>
        </div>
      </div>

      {/* SL/TP row */}
      {(signal.stop_loss_price || signal.take_profit_price) && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F1F1F]">
          {signal.stop_loss_price && (
            <div>
              <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">Stop Loss</p>
              <p className="text-red-400 font-mono text-sm">
                ${signal.stop_loss_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          {signal.take_profit_price && (
            <div>
              <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">Take Profit</p>
              <p className="text-green-400 font-mono text-sm">
                ${signal.take_profit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Conditions */}
      {signal.conditions_triggered && signal.conditions_triggered.length > 0 && (
        <div className="pt-3 border-t border-[#1F1F1F] mt-3">
          <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-2">Conditions Triggered</p>
          <div className="flex flex-wrap gap-1">
            {signal.conditions_triggered.map((c, i) => (
              <span key={i} className="bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF] text-[10px] px-2 py-0.5 rounded-full">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}