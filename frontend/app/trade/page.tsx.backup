'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, dec = 2) {
    return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function calcLivePnl(trade: any, currentPrice: number) {
    const entry = trade.entry_price;
    const leverage = trade.leverage || 1;
    const amount = trade.amount || 100;
    const pnl_pct =
        trade.direction === 'LONG'
            ? ((currentPrice - entry) / entry) * leverage * 100
            : ((entry - currentPrice) / entry) * leverage * 100;
    const pnl_usd = (pnl_pct / 100) * amount;
    return { pnl_pct, pnl_usd };
}

function duration(opened: string, closed?: string) {
    const start = new Date(opened).getTime();
    const end = closed ? new Date(closed).getTime() : Date.now();
    const mins = Math.floor((end - start) / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function toCSV(trades: any[]) {
    const headers = ['Date', 'Coin', 'Direction', 'Entry Price', 'Exit Price', 'SL', 'TP', 'Leverage', 'Amount', 'Outcome', 'PnL %', 'PnL USD', 'Duration', 'Strategy', 'Conditions'];
    const rows = trades.map(t => [
        new Date(t.opened_at).toLocaleString(),
        t.coin,
        t.direction,
        t.entry_price,
        t.exit_price ?? '',
        t.stop_loss_price,
        t.take_profit_price,
        t.leverage,
        t.amount,
        t.outcome ?? '',
        t.pnl_pct != null ? t.pnl_pct.toFixed(2) : '',
        t.pnl_usd != null ? t.pnl_usd.toFixed(2) : '',
        duration(t.opened_at, t.closed_at),
        t.strategy_name ?? '',
        (t.conditions_triggered || []).join(' | '),
    ]);
    return [headers, ...rows].map(r => r.join(',')).join('\n');
}

// ─── Confirm modal ───────────────────────────────────────────────────────────

function ConfirmModal({ trade, currentPrice, onConfirm, onCancel }: any) {
    const { pnl_pct, pnl_usd } = calcLivePnl(trade, currentPrice);
    const isPos = pnl_pct >= 0;
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 w-full max-w-sm">
                <p className="text-white font-bold text-base mb-1">Close Trade?</p>
                <p className="text-[#9CA3AF] text-xs mb-4">
                    {trade.coin} {trade.direction} @ exit ${fmt(currentPrice)}
                </p>
                <div className="flex justify-between mb-6">
                    <div>
                        <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">PnL %</p>
                        <p className={`font-mono font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                            {isPos ? '+' : ''}{fmt(pnl_pct)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-[#4B5563] uppercase tracking-widest mb-1">PnL USD</p>
                        <p className={`font-mono font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                            {isPos ? '+' : ''}${fmt(pnl_usd)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-[#1F1F1F] text-[#9CA3AF] text-xs uppercase tracking-widest hover:bg-[#1F1F1F] transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => onConfirm(currentPrice, pnl_pct, pnl_usd)} className="flex-1 py-2 rounded-lg bg-[#FACC15] text-black font-bold text-xs uppercase tracking-widest hover:bg-[#FDD047] transition-colors">
                        Confirm Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TradePage() {
    const { user, tradeToLog, setTradeToLog, openTrades, closedTrades, setOpenTrades, setClosedTrades } = useStore();

    // Form state
    const [form, setForm] = useState({
        coin: '', direction: 'LONG', entry_price: '', stop_loss_price: '',
        take_profit_price: '', leverage: '1', amount: '100',
        strategy_name: '', conditions_triggered: [] as string[],
    });
    const [submitting, setSubmitting] = useState(false);

    // Live prices  { [tradeId]: number }
    const [livePrices, setLivePrices] = useState<Record<string, number>>({});

    // Confirm modal
    const [closing, setClosing] = useState<any>(null);

    // Account summary
    const [startingBalance, setStartingBalance] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            return parseFloat(localStorage.getItem('alphaDesk_startBalance') || '10000');
        }
        return 10000;
    });
    const [editingBalance, setEditingBalance] = useState(false);
    const [balanceInput, setBalanceInput] = useState('');

    // Filters
    const [filterStrategy, setFilterStrategy] = useState('');
    const [filterCoin, setFilterCoin] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const dateTabRef = useRef<HTMLDivElement>(null);

    // ── Pre-populate form from signal ──────────────────────────────────────────
    useEffect(() => {
        if (tradeToLog) {
            setForm({
                coin: tradeToLog.coin || '',
                direction: (tradeToLog.direction || 'LONG').toUpperCase(),
                entry_price: String(tradeToLog.entry_price || ''),
                stop_loss_price: String(tradeToLog.stop_loss_price || ''),
                take_profit_price: String(tradeToLog.take_profit_price || ''),
                leverage: '1',
                amount: '100',
                strategy_name: tradeToLog.strategy_name || '',
                conditions_triggered: tradeToLog.conditions_triggered || [],
            });
        }
    }, [tradeToLog]);

    // ── Load trades ───────────────────────────────────────────────────────────
    const loadTrades = useCallback(async () => {
        if (!user) return;
        const res = await fetch(`${API}/api/trade/?user_id=${user.id}`);
        const json = await res.json();
        const all = Array.isArray(json) ? json : [];
        setOpenTrades(all.filter((t: any) => t.status === 'open'));
        setClosedTrades(all.filter((t: any) => t.status === 'closed'));
    }, [user, setOpenTrades, setClosedTrades]);

    useEffect(() => { loadTrades(); }, [loadTrades]);

    // ── Poll live prices every 10 s via Cloudflare proxy ────────────────────
    useEffect(() => {
        if (!openTrades.length) return;
        const BYBIT_PROXY = 'https://bybit-proxy.alphadeskproxy.workers.dev';
        const fetchPrices = async () => {
            const coins = Array.from(new Set(openTrades.map((t: any) => t.coin)));
            const results: Record<string, number> = {};
            await Promise.all(coins.map(async (coin: any) => {
                try {
                    const symbol = coin.toUpperCase().endsWith('USDT') ? coin.toUpperCase() : `${coin.toUpperCase()}USDT`;
                    const r = await fetch(`${BYBIT_PROXY}/v5/market/tickers?category=spot&symbol=${symbol}`);
                    const d = await r.json();
                    const price = parseFloat(d?.result?.list?.[0]?.lastPrice);
                    if (!isNaN(price)) results[coin] = price;
                } catch { /* silent */ }
            }));
            const byId: Record<string, number> = {};
            openTrades.forEach((t: any) => {
                if (results[t.coin]) byId[t.id] = results[t.coin];
            });
            setLivePrices(byId);
        };
        fetchPrices();
        const interval = setInterval(fetchPrices, 10000);
        return () => clearInterval(interval);
    }, [openTrades]);

    // ── Auto-close on SL/TP hit ───────────────────────────────────────────────
    useEffect(() => {
        openTrades.forEach(async (trade: any) => {
            const price = livePrices[trade.id];
            if (!price) return;
            let outcome: string | null = null;
            if (trade.direction === 'LONG') {
                if (price <= trade.stop_loss_price) outcome = 'LOSS';
                else if (price >= trade.take_profit_price) outcome = 'WIN';
            } else {
                if (price >= trade.stop_loss_price) outcome = 'LOSS';
                else if (price <= trade.take_profit_price) outcome = 'WIN';
            }
            if (outcome) {
                const { pnl_pct, pnl_usd } = calcLivePnl(trade, price);
                await fetch(`${API}/api/trade/${trade.id}/close`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exit_price: price, outcome, pnl_pct, pnl_usd }),
                });
                loadTrades();
            }
        });
    }, [livePrices, openTrades, loadTrades]);

    // ── Submit new trade ─────────────────────────────────────────────────────
    const handleConfirmTrade = async () => {
        if (!user) return;
        setSubmitting(true);
        try {
            await fetch(`${API}/api/trade/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    coin: form.coin.toUpperCase(),
                    direction: form.direction,
                    entry_price: parseFloat(form.entry_price),
                    stop_loss_price: parseFloat(form.stop_loss_price),
                    take_profit_price: parseFloat(form.take_profit_price),
                    leverage: parseFloat(form.leverage),
                    amount: parseFloat(form.amount),
                    strategy_name: form.strategy_name,
                    conditions_triggered: form.conditions_triggered,
                }),
            });
            setTradeToLog(null);
            setForm({ coin: '', direction: 'LONG', entry_price: '', stop_loss_price: '', take_profit_price: '', leverage: '1', amount: '100', strategy_name: '', conditions_triggered: [] });
            await loadTrades();
        } finally {
            setSubmitting(false);
        }
    };

    // ── Manual close ─────────────────────────────────────────────────────────
    const handleClose = async (exitPrice: number, pnl_pct: number, pnl_usd: number) => {
        await fetch(`${API}/api/trade/${closing.id}/close`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exit_price: exitPrice, outcome: 'MANUAL', pnl_pct, pnl_usd }),
        });
        setClosing(null);
        loadTrades();
    };

    // ── Account summary math ─────────────────────────────────────────────────
    const totalPnlUsd = closedTrades.reduce((s: number, t: any) => s + (t.pnl_usd || 0), 0);
    const currentBalance = startingBalance + totalPnlUsd;
    const totalReturn = startingBalance > 0 ? (totalPnlUsd / startingBalance) * 100 : 0;
    const wins = closedTrades.filter((t: any) => t.outcome === 'WIN').length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    // ── Filters ───────────────────────────────────────────────────────────────
    const strategies = Array.from(new Set(closedTrades.map((t: any) => t.strategy_name).filter(Boolean)));
    const coins = Array.from(new Set(closedTrades.map((t: any) => t.coin)));
    const tradeDates = Array.from(new Set(closedTrades.map((t: any) => fmtDate(t.opened_at))));

    const filtered = closedTrades.filter((t: any) => {
        if (filterStrategy && t.strategy_name !== filterStrategy) return false;
        if (filterCoin && t.coin !== filterCoin) return false;
        if (filterDate && fmtDate(t.opened_at) !== filterDate) return false;
        return true;
    });

    const inputCls = "w-full bg-[#111111] border border-[#1F1F1F] text-white rounded-lg px-3 py-2 text-sm font-mono focus:border-[#FACC15] focus:outline-none";
    const labelCls = "text-[10px] text-[#4B5563] uppercase tracking-widest mb-1 block";

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-black text-white pb-24 pt-20 px-4 max-w-[960px] mx-auto">

            {/* ── Section 1: Account Summary ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                {[
                    {
                        label: 'Starting Balance',
                        value: (
                            editingBalance
                                ? <div className="flex gap-1 items-center">
                                    <input
                                        autoFocus
                                        className="w-24 bg-[#111111] border border-[#FACC15] text-white rounded px-2 py-0.5 text-sm font-mono focus:outline-none"
                                        value={balanceInput}
                                        onChange={e => setBalanceInput(e.target.value)}
                                    />
                                    <button onClick={() => {
                                        const v = parseFloat(balanceInput);
                                        if (!isNaN(v)) { setStartingBalance(v); localStorage.setItem('alphaDesk_startBalance', String(v)); }
                                        setEditingBalance(false);
                                    }} className="text-[#FACC15] text-xs">✓</button>
                                </div>
                                : <span onClick={() => { setBalanceInput(String(startingBalance)); setEditingBalance(true); }} className="cursor-pointer hover:text-[#FACC15] transition-colors font-mono text-lg">${fmt(startingBalance)}</span>
                        )
                    },
                    { label: 'Current Balance', value: <span className={`font-mono text-lg ${currentBalance >= startingBalance ? 'text-green-400' : 'text-red-400'}`}>${fmt(currentBalance)}</span> },
                    { label: 'Total Return', value: <span className={`font-mono text-lg ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalReturn >= 0 ? '+' : ''}{fmt(totalReturn)}%</span> },
                    { label: 'Win Rate', value: <span className="font-mono text-lg text-[#FACC15]">{fmt(winRate, 1)}%</span> },
                    { label: 'Total Trades', value: <span className="font-mono text-lg text-white">{closedTrades.length}</span> },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
                        <p className={labelCls}>{label}</p>
                        <div>{value}</div>
                    </div>
                ))}
            </div>

            {/* ── New Trade Form ── */}
            <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-5 mb-8">
                <p className="text-[#FACC15] text-xs font-black uppercase tracking-widest mb-4">
                    {tradeToLog ? '📒 Log Signal Trade' : '+ New Trade'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                        <label className={labelCls}>Coin</label>
                        <input className={inputCls} placeholder="BTC" value={form.coin} onChange={e => setForm(f => ({ ...f, coin: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Direction</label>
                        <select className={inputCls} value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                            <option>LONG</option>
                            <option>SHORT</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Entry Price</label>
                        <input className={inputCls} placeholder="0.00" type="number" value={form.entry_price} onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Stop Loss</label>
                        <input className={inputCls} placeholder="0.00" type="number" value={form.stop_loss_price} onChange={e => setForm(f => ({ ...f, stop_loss_price: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Take Profit</label>
                        <input className={inputCls} placeholder="0.00" type="number" value={form.take_profit_price} onChange={e => setForm(f => ({ ...f, take_profit_price: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Leverage</label>
                        <input className={inputCls} placeholder="1" type="number" value={form.leverage} onChange={e => setForm(f => ({ ...f, leverage: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Amount (USD)</label>
                        <input className={inputCls} placeholder="100" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                        <label className={labelCls}>Strategy Name</label>
                        <input className={inputCls} placeholder="e.g. RSI Divergence" value={form.strategy_name} onChange={e => setForm(f => ({ ...f, strategy_name: e.target.value }))} />
                    </div>
                </div>
                <button
                    onClick={handleConfirmTrade}
                    disabled={submitting || !form.coin || !form.entry_price}
                    className="w-full py-2.5 bg-[#FACC15] hover:bg-[#FDD047] disabled:opacity-40 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors"
                >
                    {submitting ? 'Saving…' : 'Confirm Trade'}
                </button>
            </div>

            {/* ── Section 2: Open Trades ── */}
            {openTrades.length > 0 && (
                <div className="mb-8">
                    <p className="text-[#FACC15] text-xs font-black uppercase tracking-widest mb-3">Open Trades ({openTrades.length})</p>
                    <div className="flex flex-col gap-3">
                        {openTrades.map((trade: any) => {
                            const price = livePrices[trade.id];
                            const { pnl_pct, pnl_usd } = price ? calcLivePnl(trade, price) : { pnl_pct: 0, pnl_usd: 0 };
                            const isPos = pnl_pct >= 0;
                            const isLong = trade.direction === 'LONG';
                            return (
                                <div key={trade.id} className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-[#1F1F1F] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">{trade.coin}</span>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${isLong ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                {isLong ? '↑ LONG' : '↓ SHORT'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setClosing(trade)}
                                            className="text-[10px] text-[#4B5563] hover:text-red-400 uppercase tracking-widest border border-[#1F1F1F] px-3 py-1 rounded-lg hover:border-red-400 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div>
                                            <p className={labelCls}>Entry</p>
                                            <p className="font-mono text-sm text-white">${fmt(trade.entry_price)}</p>
                                        </div>
                                        <div>
                                            <p className={labelCls}>Live Price</p>
                                            <p className="font-mono text-sm text-[#FACC15]">{price ? `$${fmt(price)}` : '…'}</p>
                                        </div>
                                        <div>
                                            <p className={labelCls}>Live PnL</p>
                                            <p className={`font-mono text-sm font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                                                {price ? `${isPos ? '+' : ''}${fmt(pnl_pct)}%` : '…'}
                                            </p>
                                            <p className={`font-mono text-xs ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                                                {price ? `${isPos ? '+' : ''}$${fmt(pnl_usd)}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#1F1F1F]">
                                        <div>
                                            <p className={labelCls}>Stop Loss</p>
                                            <p className="font-mono text-sm text-red-400">${fmt(trade.stop_loss_price)}</p>
                                        </div>
                                        <div>
                                            <p className={labelCls}>Take Profit</p>
                                            <p className="font-mono text-sm text-green-400">${fmt(trade.take_profit_price)}</p>
                                        </div>
                                        <div>
                                            <p className={labelCls}>Opened</p>
                                            <p className="font-mono text-xs text-[#9CA3AF]">{duration(trade.opened_at)} ago</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Section 3: Trade Journal ── */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[#FACC15] text-xs font-black uppercase tracking-widest">Trade Journal</p>
                    <button
                        onClick={() => {
                            const csv = toCSV(filtered);
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'alphaDesk_trades.csv'; a.click();
                        }}
                        className="text-[10px] text-[#4B5563] hover:text-white uppercase tracking-widest border border-[#1F1F1F] px-3 py-1 rounded-lg hover:border-[#2E2E2E] transition-colors"
                    >
                        ↓ CSV
                    </button>
                </div>

                {/* Filter bar */}
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <select
                        className="bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF] rounded-lg px-3 py-2 text-xs uppercase tracking-wider focus:border-[#FACC15] focus:outline-none"
                        value={filterStrategy}
                        onChange={e => setFilterStrategy(e.target.value)}
                    >
                        <option value="">All Strategies</option>
                        {strategies.map((s: any) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select
                        className="bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF] rounded-lg px-3 py-2 text-xs uppercase tracking-wider focus:border-[#FACC15] focus:outline-none"
                        value={filterCoin}
                        onChange={e => setFilterCoin(e.target.value)}
                    >
                        <option value="">All Coins</option>
                        {coins.map((c: any) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Date tabs */}
                {tradeDates.length > 0 && (
                    <div className="relative mb-4">
                        <button
                            onClick={() => { if (dateTabRef.current) dateTabRef.current.scrollLeft -= 160; }}
                            className="absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-black to-transparent text-[#4B5563] hover:text-white"
                        >‹</button>
                        <div ref={dateTabRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-6" style={{ scrollBehavior: 'smooth' }}>
                            <button
                                onClick={() => setFilterDate('')}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest border transition-colors ${!filterDate ? 'bg-[#FACC15] text-black border-[#FACC15] font-bold' : 'border-[#1F1F1F] text-[#4B5563] hover:text-white hover:border-[#2E2E2E]'}`}
                            >All</button>
                            {tradeDates.map(date => (
                                <button
                                    key={date}
                                    onClick={() => setFilterDate(date)}
                                    className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs uppercase tracking-widest border transition-colors ${filterDate === date ? 'bg-[#FACC15] text-black border-[#FACC15] font-bold' : 'border-[#1F1F1F] text-[#4B5563] hover:text-white hover:border-[#2E2E2E]'}`}
                                >{date}</button>
                            ))}
                        </div>
                        <button
                            onClick={() => { if (dateTabRef.current) dateTabRef.current.scrollLeft += 160; }}
                            className="absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-black to-transparent text-[#4B5563] hover:text-white"
                        >›</button>
                    </div>
                )}

                {/* Journal rows */}
                {filtered.length === 0 ? (
                    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-8 text-center text-[#4B5563] text-sm">
                        No closed trades yet.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filtered.map((trade: any) => {
                            const isWin = trade.outcome === 'WIN';
                            const isLoss = trade.outcome === 'LOSS';
                            const isPos = (trade.pnl_pct || 0) >= 0;
                            const isLong = trade.direction === 'LONG';
                            return (
                                <div key={trade.id} className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-4">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#4B5563] font-mono text-xs">{new Date(trade.opened_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="bg-[#1F1F1F] text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase">{trade.coin}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${isLong ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                {isLong ? '↑ L' : '↓ S'}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${isWin ? 'bg-green-500/20 text-green-400 border-green-500/30' : isLoss ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-[#1F1F1F] text-[#9CA3AF] border-[#1F1F1F]'}`}>
                                                {trade.outcome || 'MANUAL'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={labelCls}>PnL</p>
                                                <p className={`font-mono text-sm font-bold ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                                                    {isPos ? '+' : ''}{fmt(trade.pnl_pct || 0)}% / {isPos ? '+' : ''}${fmt(trade.pnl_usd || 0)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={labelCls}>Duration</p>
                                                <p className="font-mono text-xs text-[#9CA3AF]">{duration(trade.opened_at, trade.closed_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-2 flex-wrap">
                                        <span className="text-[10px] text-[#4B5563]">Entry <span className="text-white font-mono">${fmt(trade.entry_price)}</span></span>
                                        <span className="text-[10px] text-[#4B5563]">Exit <span className="text-white font-mono">${fmt(trade.exit_price || 0)}</span></span>
                                        {trade.strategy_name && <span className="text-[10px] text-[#FACC15] uppercase">{trade.strategy_name}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Close confirm modal */}
            {closing && (
                <ConfirmModal
                    trade={closing}
                    currentPrice={livePrices[closing.id] || closing.entry_price}
                    onConfirm={handleClose}
                    onCancel={() => setClosing(null)}
                />
            )}
        </div>
    );
}