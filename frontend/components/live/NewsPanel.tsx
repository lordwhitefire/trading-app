'use client';

import React, { useEffect, useState } from 'react';
import { getNews } from '@/lib/api';

interface NewsItem {
  title: string;
  source: string;
  timeAgo: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  url?: string;
}

const MOCK_NEWS: NewsItem[] = [
  { title: 'SEC Approves Spot Ethereum ETF Listing Rule Changes', source: 'CryptoSlate', timeAgo: '2 mins ago', sentiment: 'BULLISH' },
  { title: 'Institutional Whale Moves $400M BTC to Coinbase', source: 'Bloomberg', timeAgo: '15 mins ago', sentiment: 'NEUTRAL' },
  { title: "Global Inflation Data Higher Than Analysts' Forecast", source: 'Reuters', timeAgo: '42 mins ago', sentiment: 'BEARISH' },
];

const sentimentStyles = {
  BULLISH: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BEARISH: 'bg-red-500/20 text-red-400 border border-red-500/30',
  NEUTRAL: 'bg-[#1F1F1F] text-[#9CA3AF] border border-[#2E2E2E]',
};

export default function NewsPanel() {
  const [news, setNews] = useState<NewsItem[]>(MOCK_NEWS);

  useEffect(() => {
    getNews('BTC')
      .then((data) => { if (data?.length) setNews(data); })
      .catch(() => { });
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-white font-bold text-2xl mb-4 flex items-center gap-3">
        <span className="text-[#FACC15]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </span>
        Market News
      </h2>

      <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl overflow-hidden">
        {news.map((item, index) => (
          <div
            key={index}
            className={`p-4 flex items-start justify-between gap-4 ${index < news.length - 1 ? 'border-b border-[#1F1F1F]' : ''
              }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-snug mb-1">{item.title}</p>
              <p className="text-[#4B5563] text-xs">{item.timeAgo} • {item.source}</p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${sentimentStyles[item.sentiment]}`}>
              {item.sentiment}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}