'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { getLiveSignal } from '@/lib/api';
import SignalCard from '@/components/live/SignalCard';
import NewsPanel from '@/components/live/NewsPanel';
import ETFPanel from '@/components/live/ETFPanel';

const REFRESH_INTERVAL = 30;

export default function LivePage() {
  const { activeStrategy, liveSignals, addLiveSignal } = useStore();
  const [signals, setSignals] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [error, setError] = useState('');
  // ── NEW: scanning state ──
  const [isScanning, setIsScanning] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const checkSignal = async () => {
    if (!activeStrategy) return;
    setLoading(true);
    setError('');
    try {
      const data = await getLiveSignal(activeStrategy);
      if (data && data.coin) {
        const signalWithTime = {
          ...data,
          timestamp: new Date().toLocaleTimeString('en-GB'),
        };
        setSignals(prev => [signalWithTime, ...prev].slice(0, 20));
        addLiveSignal(signalWithTime);
      }
      setLastChecked(new Date().toLocaleTimeString('en-GB'));
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to check signal');
    } finally {
      setLoading(false);
    }
  };

  // ── NEW: start/stop helpers ──
  const stopScanning = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
    setIsScanning(false);
  };

  const startScanning = () => {
    if (intervalRef.current) return; // already running
    setIsScanning(true);
    setCountdown(REFRESH_INTERVAL);
    checkSignal();
    intervalRef.current = setInterval(() => {
      checkSignal();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
  };

  useEffect(() => {
    if (!activeStrategy) return;
    startScanning();
    return () => stopScanning();
  }, [activeStrategy]);

  const activeCoin = activeStrategy?.coin || 'BTC';

  if (!activeStrategy) {
    return (
      <div className="max-w-[1280px] mx-auto px-6 py-24 flex flex-col items-center justify-center">
        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-16 text-center max-w-md">
          <div className="text-4xl mb-4">📡</div>
          <h2 className="text-white font-bold text-xl mb-3">No Active Strategy</h2>
          <p className="text-[#4B5563] text-sm mb-6">
            To see live signals, go to your profile, find a saved strategy and click the Live button. Or build a new strategy in the builder.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/profile"
              className="bg-[#FACC15] text-black font-bold px-5 py-2.5 rounded-lg uppercase tracking-widest text-xs hover:bg-[#FDE047] transition-colors">
              → My Profile
            </Link>
            <Link href="/builder"
              className="border border-[#1F1F1F] text-white font-bold px-5 py-2.5 rounded-lg uppercase tracking-widest text-xs hover:border-[#FACC15] hover:text-[#FACC15] transition-colors">
              → Builder
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white font-black text-3xl uppercase tracking-tight flex items-center gap-3">
          {/* Live/paused indicator dot */}
          <span className="relative flex h-3 w-3">
            {isScanning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isScanning ? 'bg-green-500' : 'bg-[#4B5563]'}`} />
          </span>
          {isScanning ? 'Live Signals' : 'Signals Paused'}
        </h1>

        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-[#FACC15] text-xs uppercase tracking-widest animate-pulse">Checking...</span>
          )}

          {isScanning && (
            <span className="text-[#4B5563] text-xs font-mono uppercase tracking-widest">
              Refresh in: {countdown}s
            </span>
          )}

          {/* Check Now — only when scanning */}
          {isScanning && (
            <button onClick={checkSignal} disabled={loading}
              className="text-xs border border-[#1F1F1F] hover:border-[#FACC15] text-[#4B5563] hover:text-[#FACC15] px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors disabled:opacity-40">
              ↻ Check Now
            </button>
          )}

          {/* ── Stop / Resume toggle ── */}
          {isScanning ? (
            <button onClick={stopScanning}
              className="text-xs border border-red-500/40 hover:border-red-500 text-red-400/70 hover:text-red-400 px-4 py-1.5 rounded-lg uppercase tracking-widest transition-colors font-semibold">
              ⏹ Stop
            </button>
          ) : (
            <button onClick={startScanning}
              className="text-xs border border-green-500/40 hover:border-green-500 text-green-400/70 hover:text-green-400 px-4 py-1.5 rounded-lg uppercase tracking-widest transition-colors font-semibold">
              ▶ Resume
            </button>
          )}
        </div>
      </div>

      {/* Active strategy banner */}
      <div className={`bg-[#0D0D0D] border rounded-xl p-4 mb-6 flex items-center justify-between transition-colors
        ${isScanning ? 'border-[#FACC15]/20' : 'border-[#1F1F1F]'}`}>
        <div>
          <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">Active Strategy</p>
          <p className="text-white font-bold">{activeStrategy.name}</p>
          <div className="flex gap-3 mt-1">
            <span className="text-[10px] text-[#4B5563] uppercase">{activeStrategy.coin}</span>
            <span className="text-[10px] text-[#4B5563] uppercase">{activeStrategy.timeframe}</span>
            <span className="text-[10px] text-[#4B5563] uppercase">{activeStrategy.conditions?.length} conditions</span>
          </div>
        </div>
        <div className="text-right">
          {lastChecked && (
            <p className="text-[10px] text-[#4B5563] uppercase tracking-widest">
              Last checked: {lastChecked}
            </p>
          )}
          {!isScanning && (
            <p className="text-[10px] text-red-400/60 uppercase tracking-widest mt-1">
              Monitoring paused
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Signal Cards */}
      <div className="mb-8">
        {signals.length === 0 && !loading ? (
          <div className="border border-dashed border-[#1F1F1F] rounded-xl p-10 text-center">
            <p className="text-[#4B5563] text-sm">
              {isScanning
                ? `Monitoring ${activeStrategy.coin} on ${activeStrategy.timeframe} timeframe. No signals detected yet. Checking every ${REFRESH_INTERVAL} seconds.`
                : 'Monitoring is paused. Click Resume to continue scanning.'}
            </p>
          </div>
        ) : (
          signals.map((signal, index) => (
            <SignalCard key={index} signal={signal} />
          ))
        )}
      </div>

      {/* News and ETF */}
      <NewsPanel coin={activeStrategy?.coin} coins={activeStrategy?.coins} />
      <ETFPanel coin={activeStrategy?.coin} coins={activeStrategy?.coins} />

    </div>
  );
}