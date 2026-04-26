'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
    const router = useRouter();
    const {
        user, savedStrategies, savedResults,
        deleteStrategy, deleteResult, setBacktestResults
    } = useStore();
    const [activeTab, setActiveTab] = useState<'strategies' | 'results'>('strategies');

    const handleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    if (!user) {
        return (
            <div className="max-w-[1280px] mx-auto px-6 py-24 flex flex-col items-center justify-center">
                <div className="border border-dashed border-[#1F1F1F] rounded-xl p-16 text-center max-w-md">
                    <div className="text-4xl mb-4">👤</div>
                    <h2 className="text-white font-bold text-xl mb-3">Sign in to view your profile</h2>
                    <p className="text-[#4B5563] text-sm mb-6">
                        Save your strategies and results. Access them from any device.
                    </p>
                    <button
                        onClick={handleSignIn}
                        className="bg-[#FACC15] text-black font-bold px-6 py-3 rounded-lg uppercase tracking-widest text-sm hover:bg-[#FDE047] transition-colors"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    const totalWins = savedResults.reduce((acc: number, r: any) => acc + (r.results?.wins || 0), 0);
    const totalSignals = savedResults.reduce((acc: number, r: any) => acc + (r.results?.total_signals || 0), 0);
    const avgWinRate = savedResults.length > 0
        ? (savedResults.reduce((acc: number, r: any) => acc + (r.results?.win_rate || 0), 0) / savedResults.length).toFixed(1)
        : '0';

    return (
        <div className="max-w-[1280px] mx-auto px-4 py-8 pb-32 space-y-8">

            {/* Profile header */}
            <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
                <div className="flex items-center gap-5">
                    <img
                        src={user.user_metadata?.avatar_url || ''}
                        alt="avatar"
                        className="w-16 h-16 rounded-full border-2 border-[#FACC15]"
                        onError={(e: any) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    <div>
                        <h1 className="text-white font-black text-2xl">
                            {user.user_metadata?.full_name || 'Trader'}
                        </h1>
                        <p className="text-[#4B5563] text-sm">{user.email}</p>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Saved Strategies', value: savedStrategies.length },
                        { label: 'Backtest Runs', value: savedResults.length },
                        { label: 'Avg Win Rate', value: `${avgWinRate}%` },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-4 text-center">
                            <p className="text-2xl font-mono font-bold text-[#FACC15]">{stat.value}</p>
                            <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {(['strategies', 'results'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab
                                ? 'bg-[#FACC15] text-black'
                                : 'bg-[#0D0D0D] border border-[#1F1F1F] text-[#4B5563] hover:text-white'
                            }`}
                    >
                        {tab === 'strategies' ? `⚙ Strategies (${savedStrategies.length})` : `📊 Results (${savedResults.length})`}
                    </button>
                ))}
            </div>

            {/* Strategies tab */}
            {activeTab === 'strategies' && (
                <div className="space-y-3">
                    {savedStrategies.length === 0 ? (
                        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-12 text-center">
                            <p className="text-[#4B5563] text-sm mb-4">No saved strategies yet.</p>
                            <Link
                                href="/builder"
                                className="text-[#FACC15] text-sm hover:underline"
                            >
                                → Build your first strategy
                            </Link>
                        </div>
                    ) : (
                        savedStrategies.map((strategy: any) => (
                            <div
                                key={strategy.id}
                                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-5 flex items-center justify-between hover:border-[#2E2E2E] transition-colors"
                            >
                                <div>
                                    <h3 className="text-white font-bold">{strategy.name}</h3>
                                    <div className="flex gap-3 mt-1 flex-wrap">
                                        <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{strategy.coin}</span>
                                        <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{strategy.timeframe}</span>
                                        <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{strategy.conditions?.length} conditions</span>
                                        <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">
                                            {new Date(strategy.created_at).toLocaleDateString('en-GB')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href="/builder"
                                        className="text-xs text-[#FACC15] border border-[#FACC15]/30 px-3 py-1.5 rounded-lg hover:bg-[#FACC15]/10 transition-colors"
                                    >
                                        Load
                                    </Link>
                                    <button
                                        onClick={() => deleteStrategy(strategy.id)}
                                        className="text-xs text-red-500/60 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Results tab */}
            {activeTab === 'results' && (
                <div className="space-y-3">
                    {savedResults.length === 0 ? (
                        <div className="border border-dashed border-[#1F1F1F] rounded-xl p-12 text-center">
                            <p className="text-[#4B5563] text-sm mb-4">No saved results yet.</p>
                            <Link
                                href="/builder"
                                className="text-[#FACC15] text-sm hover:underline"
                            >
                                → Run your first backtest
                            </Link>
                        </div>
                    ) : (
                        savedResults.map((result: any) => (
                            <div
                                key={result.id}
                                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-5 hover:border-[#2E2E2E] transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-white font-bold">{result.strategy_name}</h3>
                                        <div className="flex gap-3 mt-1 flex-wrap">
                                            <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{result.coin}</span>
                                            <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">{result.timeframe}</span>
                                            <span className="text-[10px] text-[#4B5563] uppercase tracking-widest">
                                                {new Date(result.created_at).toLocaleDateString('en-GB')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setBacktestResults(result.results);
                                                router.push('/results');
                                            }}
                                            className="text-xs text-[#FACC15] border border-[#FACC15]/30 px-3 py-1.5 rounded-lg hover:bg-[#FACC15]/10 transition-colors"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={() => deleteResult(result.id)}
                                            className="text-xs text-red-500/60 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Quick stats */}
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                    {[
                                        { label: 'Signals', value: result.results?.total_signals },
                                        {
                                            label: 'Win Rate',
                                            value: `${result.results?.win_rate}%`,
                                            color: result.results?.win_rate >= 50 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                                        },
                                        {
                                            label: 'Return',
                                            value: `${result.results?.total_return_pct >= 0 ? '+' : ''}${result.results?.total_return_pct?.toFixed(1)}%`,
                                            color: result.results?.total_return_pct >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                                        },
                                        { label: 'Drawdown', value: `-${result.results?.max_drawdown_pct?.toFixed(1)}%`, color: 'text-[#EF4444]' },
                                    ].map(stat => (
                                        <div key={stat.label} className="bg-[#111111] rounded-lg p-2 text-center">
                                            <p className={`font-mono text-sm font-bold ${stat.color || 'text-white'}`}>{stat.value}</p>
                                            <p className="text-[9px] text-[#4B5563] uppercase tracking-widest mt-0.5">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}