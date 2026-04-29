'use client';

import React, { useState } from 'react';

interface Props {
    results: any;
    isMultiCoin?: boolean;
    coins?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(n: number): string {
    if (n == null) return 'N/A';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
    return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(v: any): string {
    if (v == null) return 'N/A';
    return `${Number(v) >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
}

// ─── Build the report text content ───────────────────────────────────────────

function buildReport(results: any, isMultiCoin: boolean, coins: string[]): string {
    const now = new Date();
    const dateStr = now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

    const lines: string[] = [];

    // ── Header ──
    lines.push('═'.repeat(70));
    lines.push('  ALPHADESK — BACKTEST REPORT');
    lines.push(`  Generated: ${dateStr}`);
    lines.push('═'.repeat(70));
    lines.push('');

    if (isMultiCoin && coins.length > 1) {
        // ── Multi-coin report ──
        const coinResults = results.results || results;

        lines.push('MULTI-COIN BACKTEST SUMMARY');
        lines.push('─'.repeat(70));
        lines.push(`Coins tested: ${coins.join(', ')}`);
        lines.push('');

        // Summary table
        lines.push('PERFORMANCE OVERVIEW');
        lines.push('─'.repeat(70));
        const header = 'Coin'.padEnd(18) + 'Signals'.padEnd(10) + 'Win Rate'.padEnd(12) + 'Total Return'.padEnd(16) + 'Max Drawdown';
        lines.push(header);
        lines.push('─'.repeat(70));

        for (const coin of coins) {
            const r = coinResults[coin];
            if (!r) { lines.push(`${coin.padEnd(18)}No data`); continue; }
            const row =
                coin.padEnd(18) +
                String(r.total_signals ?? 'N/A').padEnd(10) +
                `${r.win_rate ?? 'N/A'}%`.padEnd(12) +
                pct(r.total_return_pct).padEnd(16) +
                pct(r.max_drawdown_pct);
            lines.push(row);
        }
        lines.push('');

        // Per-coin detail
        for (const coin of coins) {
            const r = coinResults[coin];
            if (!r) continue;

            lines.push('');
            lines.push(`▸ ${coin}`);
            lines.push('─'.repeat(50));
            lines.push(`  Timeframe:          ${r.timeframe ?? 'N/A'}`);
            lines.push(`  Backtest Period:    ${r.backtest_period ?? 'N/A'} candles`);
            lines.push(`  Total Signals:      ${r.total_signals ?? 'N/A'}`);
            lines.push(`  Wins (clean):       ${r.wins ?? 'N/A'}`);
            lines.push(`  Losses (clean):     ${r.losses ?? 'N/A'}`);
            lines.push(`  Expired Wins:       ${r.expired_wins ?? 'N/A'}`);
            lines.push(`  Expired Losses:     ${r.expired_losses ?? 'N/A'}`);
            lines.push(`  Win Rate:           ${r.win_rate ?? 'N/A'}%`);
            lines.push(`  Total Return:       ${pct(r.total_return_pct)}`);
            lines.push(`  Avg PnL/Trade:      ${pct(r.avg_pnl_pct)}`);
            lines.push(`  Max Drawdown:       ${pct(r.max_drawdown_pct)}`);

            // Trade signals
            const signals = r.signals || [];
            if (signals.length > 0) {
                lines.push('');
                lines.push(`  TRADE SIGNALS (${signals.length} total)`);
                lines.push('  ' + '─'.repeat(60));
                const sigHeader = '  Date'.padEnd(24) + 'Dir'.padEnd(8) + 'Entry'.padEnd(12) + 'Exit'.padEnd(12) + 'PnL'.padEnd(10) + 'Outcome';
                lines.push(sigHeader);
                lines.push('  ' + '─'.repeat(60));
                for (const s of signals) {
                    const row =
                        `  ${s.date ?? ''}`.padEnd(24) +
                        `${s.direction ?? ''}`.padEnd(8) +
                        `${s.entry_price ?? ''}`.padEnd(12) +
                        `${s.exit_price ?? ''}`.padEnd(12) +
                        `${pct(s.pnl_pct)}`.padEnd(10) +
                        `${s.outcome ?? ''}`;
                    lines.push(row);
                }
            }
        }

    } else {
        // ── Single-coin report ──
        const r = results;

        lines.push('BACKTEST RESULTS');
        lines.push('─'.repeat(70));
        lines.push(`  Strategy:           ${r.strategy_name ?? 'N/A'}`);
        lines.push(`  Coin:               ${r.coin ?? 'N/A'}`);
        lines.push(`  Timeframe:          ${r.timeframe ?? 'N/A'}`);
        lines.push(`  Backtest Period:    ${r.backtest_period ?? 'N/A'} candles`);
        lines.push('');
        lines.push('PERFORMANCE METRICS');
        lines.push('─'.repeat(70));
        lines.push(`  Total Signals:      ${r.total_signals ?? 'N/A'}`);
        lines.push(`  Wins (clean):       ${r.wins ?? 'N/A'}`);
        lines.push(`  Losses (clean):     ${r.losses ?? 'N/A'}`);
        lines.push(`  Expired Wins:       ${r.expired_wins ?? 'N/A'}`);
        lines.push(`  Expired Losses:     ${r.expired_losses ?? 'N/A'}`);
        lines.push(`  Win Rate:           ${r.win_rate ?? 'N/A'}%`);
        lines.push(`  Total Return:       ${pct(r.total_return_pct)}`);
        lines.push(`  Avg PnL/Trade:      ${pct(r.avg_pnl_pct)}`);
        lines.push(`  Max Drawdown:       ${pct(r.max_drawdown_pct)}`);
        lines.push('');

        // Trade signals
        const signals = r.signals || [];
        if (signals.length > 0) {
            lines.push(`TRADE SIGNALS (${signals.length} total)`);
            lines.push('─'.repeat(70));
            const sigHeader = 'Date'.padEnd(22) + 'Dir'.padEnd(8) + 'Entry'.padEnd(12) + 'Exit'.padEnd(12) + 'PnL'.padEnd(10) + 'Outcome';
            lines.push(sigHeader);
            lines.push('─'.repeat(70));
            for (const s of signals) {
                const row =
                    `${s.date ?? ''}`.padEnd(22) +
                    `${s.direction ?? ''}`.padEnd(8) +
                    `${s.entry_price ?? ''}`.padEnd(12) +
                    `${s.exit_price ?? ''}`.padEnd(12) +
                    `${pct(s.pnl_pct)}`.padEnd(10) +
                    `${s.outcome ?? ''}`;
                lines.push(row);
            }
        }
    }

    // ── AI Analysis context (questions to ask) ──
    lines.push('');
    lines.push('');
    lines.push('═'.repeat(70));
    lines.push('  HOW TO USE THIS REPORT WITH AN AI');
    lines.push('═'.repeat(70));
    lines.push('');
    lines.push('Send this entire file to any AI assistant (ChatGPT, Claude, Gemini etc.)');
    lines.push('and ask any of the following questions, or your own:');
    lines.push('');

    if (isMultiCoin && coins.length > 1) {
        lines.push('SUGGESTED QUESTIONS — MULTI-COIN');
        lines.push('─'.repeat(70));
        lines.push('1. Which coin performed best overall and why?');
        lines.push('2. Rank the coins by win rate, total return, and max drawdown.');
        lines.push('3. Which coin should I run this strategy on live and why?');
        lines.push('4. Which coin carries the most risk for this strategy?');
        lines.push('5. What does the overall picture tell you about the strategy\'s edge?');
        lines.push('6. Should I run this on all coins simultaneously or focus on one?');
        lines.push('7. What improvements would you recommend to this strategy?');
        lines.push('8. Are there any coins I should remove from this strategy?');
    } else {
        lines.push('SUGGESTED QUESTIONS — SINGLE COIN');
        lines.push('─'.repeat(70));
        lines.push('1. What are the strengths and weaknesses of this strategy?');
        lines.push('2. Which hours and days had the best and worst performance?');
        lines.push('3. What is your overall rating of this strategy (Good/Average/Poor)?');
        lines.push('4. What specific improvements would you recommend?');
        lines.push('5. Is the win rate acceptable for this type of strategy?');
        lines.push('6. Is the max drawdown too high for live trading?');
        lines.push('7. What does the average PnL per trade tell you about the edge?');
        lines.push('8. Should I increase or decrease the leverage for this strategy?');
        lines.push('9. Are there any signals that look like outliers or errors?');
        lines.push('10. Based on the expired trades, is the trade duration appropriate?');
    }

    lines.push('');
    lines.push('─'.repeat(70));
    lines.push('  AlphaDesk — AI-Powered Trading Strategy Builder');
    lines.push('─'.repeat(70));

    return lines.join('\n');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DownloadReport({ results, isMultiCoin = false, coins = [] }: Props) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = () => {
        setDownloading(true);
        try {
            const content = buildReport(results, isMultiCoin, coins);
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');

            const now = new Date();
            const dateTag = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const coinTag = isMultiCoin ? `${coins.length}-coins` : (results?.coin ?? 'result');
            a.href = url;
            a.download = `alphadesk-${coinTag}-${dateTag}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } finally {
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 border border-[#1F1F1F] hover:border-[#FACC15] text-[#4B5563] hover:text-[#FACC15] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-40"
        >
            {downloading ? (
                <>
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Preparing...
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Report
                </>
            )}
        </button>
    );
}