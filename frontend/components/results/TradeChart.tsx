'use client';

import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface Props {
    results: any;
    timezone: string;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-lg p-3 text-xs shadow-xl">
            <p className="text-[#4B5563] mb-1">{d.date}</p>
            <p className="text-white font-mono font-bold">
                Cumulative: <span className={d.cumulative >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                    {d.cumulative >= 0 ? '+' : ''}{d.cumulative.toFixed(2)}%
                </span>
            </p>
            <p className="text-[#9CA3AF] mt-1">
                Signal PnL: <span className={d.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                    {d.pnl >= 0 ? '+' : ''}{d.pnl.toFixed(2)}%
                </span>
            </p>
            <p className="text-[#9CA3AF]">Outcome: {d.outcome}</p>
        </div>
    );
};

export default function EquityCurve({ results, timezone }: Props) {
    let cumulative = 0;
    const data = results.signals.map((s: any, i: number) => {
        cumulative += s.pnl_pct;
        const date = new Date(s.date);
        return {
            index: i + 1,
            date: date.toLocaleString('en-GB', { timeZone: timezone, dateStyle: 'medium', timeStyle: 'short' }),
            cumulative: parseFloat(cumulative.toFixed(2)),
            pnl: s.pnl_pct,
            outcome: s.outcome,
        };
    });

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                <XAxis
                    dataKey="index"
                    tick={{ fill: '#4B5563', fontSize: 10 }}
                    label={{ value: 'Signal #', position: 'insideBottom', offset: -2, fill: '#4B5563', fontSize: 10 }}
                />
                <YAxis
                    tick={{ fill: '#4B5563', fontSize: 10 }}
                    tickFormatter={v => `${v}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="4 4" />
                <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#FACC15"
                    strokeWidth={2}
                    dot={{ fill: '#FACC15', r: 3 }}
                    activeDot={{ r: 6, fill: '#FDE047' }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}