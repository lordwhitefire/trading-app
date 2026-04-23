'use client';

import React, { useEffect, useState } from 'react';
import { getEtfData } from '@/lib/api';

interface ETFRow {
  ticker: string;
  netFlow: number;
  totalAum: string;
}

const MOCK_ETF: ETFRow[] = [
  { ticker: 'IBIT', netFlow: 245.2, totalAum: '$18.2B' },
  { ticker: 'FBTC', netFlow: 89.1, totalAum: '$9.4B' },
  { ticker: 'GBTC', netFlow: -102.5, totalAum: '$14.1B' },
  { ticker: 'ARKB', netFlow: 12.4, totalAum: '$2.8B' },
];

export default function ETFPanel() {
  const [etfData, setEtfData] = useState<ETFRow[]>(MOCK_ETF);

  useEffect(() => {
    getEtfData()
      .then((data) => { if (data?.length) setEtfData(data); })
      .catch(() => { });
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-white font-bold text-2xl mb-4 flex items-center gap-3">
        <span className="text-[#FACC15]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        ETF Flow Tracker
      </h2>

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 px-4 py-3 border-b border-[#1F1F1F]">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563]">Ticker</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] text-center">Net Flow (M)</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] text-right">Total AUM</span>
        </div>

        {/* Rows */}
        {etfData.map((row, index) => {
          const positive = row.netFlow >= 0;
          return (
            <div
              key={row.ticker}
              className={`grid grid-cols-3 px-4 py-4 items-center ${index < etfData.length - 1 ? 'border-b border-[#1F1F1F]' : ''
                }`}
            >
              <span className="text-white font-bold text-sm font-mono">{row.ticker}</span>
              <span className={`text-sm font-mono font-semibold text-center ${positive ? 'text-green-400' : 'text-red-400'
                }`}>
                {positive ? '+' : ''}${row.netFlow.toFixed(1)}
              </span>
              <span className="text-white text-sm font-mono text-right">{row.totalAum}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}