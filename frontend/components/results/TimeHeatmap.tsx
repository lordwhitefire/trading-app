'use client';

import React, { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  results: any;
  timezone: string;
}

const OUTCOME_COLORS: Record<string, string> = {
  'win': '#22C55E',
  'loss': '#EF4444',
  'expired-win': '#FACC15',
  'expired-loss': '#F97316',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-lg p-3 text-xs shadow-xl">
      <p className="text-[#4B5563] mb-1">{d.fullDate}</p>
      <p className="text-white">Hour: <span className="font-mono">{d.hour}:00</span></p>
      <p className="text-white">Direction: <span className={d.direction === 'long' ? 'text-[#22C55E]' : 'text-[#EF4444]'}>{d.direction?.toUpperCase()}</span></p>
      <p className="text-white">Outcome: <span style={{ color: OUTCOME_COLORS[d.outcome] }}>{d.outcome}</span></p>
      <p className="text-white">PnL: <span className={d.pnl >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>{d.pnl >= 0 ? '+' : ''}{d.pnl?.toFixed(2)}%</span></p>
    </div>
  );
};

export default function TimeHeatmap({ results, timezone }: Props) {
  const [view, setView] = useState<'scatter' | 'grid'>('scatter');

  const scatterData = results.signals.map((s: any) => {
    const date = new Date(s.date);
    const hour = parseInt(date.toLocaleString('en-GB', {
      timeZone: timezone, hour: '2-digit', hour12: false
    }));
    return {
      hour,
      pnl: s.pnl_pct,
      outcome: s.outcome,
      direction: s.direction,
      fullDate: date.toLocaleString('en-GB', {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
    };
  });

  // Grid heatmap data — average PnL per hour per day
  const gridData: Record<number, Record<number, number[]>> = {};
  results.signals.forEach((s: any) => {
    const date = new Date(s.date);
    const hour = parseInt(date.toLocaleString('en-GB', {
      timeZone: timezone, hour: '2-digit', hour12: false
    }));
    const day = date.toLocaleDateString('en-GB', { timeZone: timezone, weekday: 'short' });
    const dayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
    const dayNum = dayMap[day] ?? 0;
    if (!gridData[hour]) gridData[hour] = {};
    if (!gridData[hour][dayNum]) gridData[hour][dayNum] = [];
    gridData[hour][dayNum].push(s.pnl_pct);
  });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('scatter')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${view === 'scatter' ? 'bg-[#FACC15] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#4B5563] hover:text-white'
            }`}
        >
          Scatter View
        </button>
        <button
          onClick={() => setView('grid')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition-colors ${view === 'grid' ? 'bg-[#FACC15] text-black' : 'bg-[#111111] border border-[#1F1F1F] text-[#4B5563] hover:text-white'
            }`}
        >
          Heatmap Grid
        </button>
      </div>

      {/* Scatter view */}
      {view === 'scatter' && (
        <>
          <div className="flex gap-4 mb-4 flex-wrap">
            {Object.entries(OUTCOME_COLORS).map(([outcome, color]) => (
              <div key={outcome} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{outcome}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
              <XAxis
                type="number"
                dataKey="hour"
                domain={[0, 23]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21, 23]}
                tick={{ fill: '#4B5563', fontSize: 10 }}
                label={{ value: 'Hour of Day (UTC)', position: 'insideBottom', offset: -10, fill: '#4B5563', fontSize: 10 }}
              />
              <YAxis
                type="number"
                dataKey="pnl"
                tick={{ fill: '#4B5563', fontSize: 10 }}
                tickFormatter={v => `${v}%`}
                label={{ value: 'PnL %', angle: -90, position: 'insideLeft', fill: '#4B5563', fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter data={scatterData}>
                {scatterData.map((entry: any, i: number) => (
                  <Cell
                    key={i}
                    fill={OUTCOME_COLORS[entry.outcome] || '#9CA3AF'}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Grid heatmap view */}
      {view === 'grid' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-[#4B5563] text-left px-2 py-1 w-12">Hour</th>
                {days.map(d => (
                  <th key={d} className="text-[#4B5563] text-center px-1 py-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => (
                <tr key={hour}>
                  <td className="text-[#4B5563] px-2 py-0.5 font-mono">{String(hour).padStart(2, '0')}:00</td>
                  {days.map((_, dayNum) => {
                    const values = gridData[hour]?.[dayNum];
                    const avg = values ? values.reduce((a, b) => a + b, 0) / values.length : null;
                    const count = values?.length || 0;
                    return (
                      <td key={dayNum} className="px-1 py-0.5 text-center">
                        {avg !== null ? (
                          <div
                            className="rounded text-[10px] font-mono px-1 py-0.5"
                            style={{
                              backgroundColor: avg >= 0
                                ? `rgba(34, 197, 94, ${Math.min(0.8, Math.abs(avg) / 20)})`
                                : `rgba(239, 68, 68, ${Math.min(0.8, Math.abs(avg) / 20)})`,
                              color: Math.abs(avg) > 5 ? 'white' : '#9CA3AF',
                            }}
                            title={`${count} signal${count !== 1 ? 's' : ''}, avg ${avg.toFixed(1)}%`}
                          >
                            {count}
                          </div>
                        ) : (
                          <div className="text-[#1F1F1F]">·</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-[#4B5563] mt-3">
            Each cell shows signal count. Hover for average PnL. Green = profitable, Red = losing.
          </p>
        </div>
      )}
    </div>
  );
}