'use client';

import React from 'react';

interface Props {
    results: any;
}

export default function OutcomeBreakdown({ results }: Props) {
    const total = results.total_signals || 1;

    const items = [
        {
            label: 'Wins',
            count: results.wins,
            pct: ((results.wins / total) * 100).toFixed(1),
            color: 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E]',
            bar: 'bg-[#22C55E]',
        },
        {
            label: 'Losses',
            count: results.losses,
            pct: ((results.losses / total) * 100).toFixed(1),
            color: 'bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444]',
            bar: 'bg-[#EF4444]',
        },
        {
            label: 'Expired Win',
            count: results.expired_wins,
            pct: ((results.expired_wins / total) * 100).toFixed(1),
            color: 'bg-[#FACC15]/20 border-[#FACC15]/40 text-[#FACC15]',
            bar: 'bg-[#FACC15]',
        },
        {
            label: 'Expired Loss',
            count: results.expired_losses,
            pct: ((results.expired_losses / total) * 100).toFixed(1),
            color: 'bg-orange-900/20 border-orange-700/40 text-orange-400',
            bar: 'bg-orange-400',
        },
    ];

    return (
        <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
            <h2 className="text-white font-bold text-lg mb-6">📊 Outcome Breakdown</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={`border rounded-xl p-5 ${item.color}`}
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-2">
                            {item.label}
                        </p>
                        <p className="text-3xl font-mono font-bold mb-3">{item.count}</p>
                        <div className="w-full bg-black/30 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full ${item.bar}`}
                                style={{ width: `${item.pct}%` }}
                            />
                        </div>
                        <p className="text-xs mt-2 opacity-70">{item.pct}% of signals</p>
                    </div>
                ))}
            </div>
        </div>
    );
}