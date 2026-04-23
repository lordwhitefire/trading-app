'use client';

import React from 'react';
import { useStore } from '@/lib/store';

export default function TradeChart() {
    const { backtestResults } = useStore();

    return (
        <section className="bg-surface border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">Equity Curve</h2>
                {backtestResults && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 border border-accent/20">
                        <span className="w-2 h-2 rounded-full bg-accent pulse-dot" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Live</span>
                    </div>
                )}
            </div>

            {!backtestResults ? (
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded">
                    <p className="text-text-muted text-xs uppercase tracking-widest">Run a backtest to see the equity curve</p>
                </div>
            ) : (
                <div className="relative w-full h-64 mt-4 border-l border-b border-border/50">
                    <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#FACC15" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[40, 80, 120, 160].map((y) => (
                            <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#1F1F1F" strokeWidth="1" />
                        ))}
                        {/* Area fill */}
                        <path
                            d="M0,180 L40,170 L80,150 L120,165 L160,130 L200,110 L240,115 L280,80 L320,60 L360,75 L400,30 L400,200 L0,200 Z"
                            fill="url(#curveGradient)"
                        />
                        {/* Curve line */}
                        <path
                            d="M0,180 L40,170 L80,150 L120,165 L160,130 L200,110 L240,115 L280,80 L320,60 L360,75 L400,30"
                            fill="none"
                            stroke="#FACC15"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                        {/* End point dot */}
                        <circle cx="400" cy="30" r="4" fill="#000" stroke="#FACC15" strokeWidth="2" />
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-text-muted">
                        {['300%', '225%', '150%', '75%', '0%'].map((label) => (
                            <span key={label}>{label}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* X-axis */}
            {backtestResults && (
                <div className="flex justify-between text-[10px] font-semibold text-text-muted uppercase tracking-widest px-1">
                    {['Start', '', '', '', 'Current'].map((label, i) => (
                        <span key={i}>{label}</span>
                    ))}
                </div>
            )}
        </section>
    );
}
