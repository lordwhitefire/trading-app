'use client';

import React, { useState } from 'react';
import { chatWithResults } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  results: any;
  selectedSignal?: any;
  isMultiCoin?: boolean;
  coins?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Agent definitions ────────────────────────────────────────────────────────
const SINGLE_AGENTS = [
  {
    key: 'indicator',
    icon: '📊',
    title: 'Indicator Analyst',
    prompt: 'Analyze which indicators in this strategy contributed most to wins vs losses. Be specific about indicator performance.',
    structured: true,
  },
  {
    key: 'time',
    icon: '🕐',
    title: 'Time Analyst',
    prompt: 'Analyze the time-based performance patterns in these results. Which hours and days had the best and worst performance?',
    structured: true,
  },
  {
    key: 'summary',
    icon: '🧠',
    title: 'Strategy Summary',
    prompt: 'Give an overall assessment of this trading strategy based on the backtest results. What are the strengths, weaknesses, and overall rating?',
    structured: true,
  },
];

const buildMultiAgents = (coins: string[]) => [
  {
    key: 'comparison', icon: '⚖️', title: 'Coin Comparison', structured: false,
    prompt: `Compare the backtest results across all coins: ${coins.join(', ')}. Rank them by win rate, total PnL, and number of trades. Explain why one coin may have outperformed the others.`
  },
  {
    key: 'best_coin', icon: '🏆', title: 'Best Coin for This Strategy', structured: false,
    prompt: `Given the backtest results for ${coins.join(', ')}, which single coin would you recommend running this strategy on live? Give a clear recommendation with reasoning.`
  },
  {
    key: 'risk', icon: '⚠️', title: 'Risk Comparison', structured: false,
    prompt: `Analyze the risk profile of this strategy across ${coins.join(', ')}. Compare max drawdown, losing streaks, and volatility per coin.`
  },
  {
    key: 'summary', icon: '🧠', title: 'Multi-Coin Strategy Summary', structured: false,
    prompt: `Give a comprehensive summary of how this strategy performs across ${coins.join(', ')}. Should the user run it on all coins simultaneously or focus on one?`
  },
];

// ─── Context builder (mirrors backend logic for what aiResults looks like) ───
function buildAiContext(results: any, isMultiCoin: boolean, coins: string[]): any {
  if (!isMultiCoin) return results;
  const summary: Record<string, any> = {};
  for (const coin of coins) {
    const r = results[coin] || (results.results && results.results[coin]);
    if (!r) continue;
    summary[coin] = {
      coin, total_signals: r.total_signals, wins: r.wins, losses: r.losses,
      expired_wins: r.expired_wins, expired_losses: r.expired_losses,
      win_rate: r.win_rate, total_return_pct: r.total_return_pct ?? r.net_pnl,
      avg_pnl_pct: r.avg_pnl_pct, max_drawdown_pct: r.max_drawdown_pct,
      timeframe: r.timeframe, backtest_period: r.backtest_period,
    };
  }
  return { multi_coin: true, coins, results: summary };
}

// ─── Structured renderers ─────────────────────────────────────────────────────

function SummaryCard({ text }: { text: string }) {
  return (
    <div className="border-l-4 border-[#FACC15] bg-[#FACC15]/5 rounded-r-lg px-4 py-3 mb-4">
      <p className="text-white text-sm font-medium leading-relaxed">{text}</p>
    </div>
  );
}

function RatingBadge({ rating }: { rating: string }) {
  const cfg: Record<string, { bg: string; text: string; border: string }> = {
    Good: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40' },
    Average: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
    Poor: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
  };
  const c = cfg[rating] ?? cfg['Average'];
  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full border text-sm font-black uppercase tracking-widest ${c.bg} ${c.text} ${c.border}`}>
      {rating === 'Good' ? '✓' : rating === 'Poor' ? '✕' : '~'} {rating}
    </span>
  );
}

function PerformerCards({ items, type }: { items: { indicator: string; insight: string }[]; type: 'top' | 'worst' }) {
  const isTop = type === 'top';
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className={`rounded-lg border p-3 flex gap-3 items-start ${isTop ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 ${isTop ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {item.indicator}
          </span>
          <p className="text-[#9CA3AF] text-xs leading-relaxed">{item.insight}</p>
        </div>
      ))}
    </div>
  );
}

function TimeCards({ items, type }: { items: { hour?: string; day?: string; insight: string }[]; type: 'best' | 'worst' }) {
  const isBest = type === 'best';
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className={`rounded-lg border p-3 flex gap-3 items-start ${isBest ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 whitespace-nowrap ${isBest ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {item.hour || item.day}
          </span>
          <p className="text-[#9CA3AF] text-xs leading-relaxed">{item.insight}</p>
        </div>
      ))}
    </div>
  );
}

function CheckList({ items, type }: { items: string[]; type: 'strength' | 'weakness' }) {
  const isStrength = type === 'strength';
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className={`mt-0.5 shrink-0 font-black ${isStrength ? 'text-green-400' : 'text-red-400'}`}>
            {isStrength ? '✓' : '✕'}
          </span>
          <span className="text-[#9CA3AF]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Recommendations({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="shrink-0 w-5 h-5 rounded-full bg-[#FACC15]/20 border border-[#FACC15]/40 text-[#FACC15] text-[10px] font-black flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span className="text-[#9CA3AF]">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ─── Structured output renderer — switches on agent key ──────────────────────
function StructuredResult({ agentKey, data }: { agentKey: string; data: any }) {
  if (!data) return null;

  if (agentKey === 'indicator') {
    return (
      <div className="space-y-4 pt-4">
        {data.summary && <SummaryCard text={data.summary} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.top_performers?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400 mb-2">Top Performers</p>
              <PerformerCards items={data.top_performers} type="top" />
            </div>
          )}
          {data.worst_performers?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-2">Worst Performers</p>
              <PerformerCards items={data.worst_performers} type="worst" />
            </div>
          )}
        </div>
        {data.recommendations?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FACC15] mb-2">Recommendations</p>
            <Recommendations items={data.recommendations} />
          </div>
        )}
      </div>
    );
  }

  if (agentKey === 'time') {
    return (
      <div className="space-y-4 pt-4">
        {data.summary && <SummaryCard text={data.summary} />}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.best_hours?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400 mb-2">Best Hours</p>
              <TimeCards items={data.best_hours} type="best" />
            </div>
          )}
          {data.worst_hours?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-2">Worst Hours</p>
              <TimeCards items={data.worst_hours} type="worst" />
            </div>
          )}
        </div>
        {data.best_days?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563] mb-2">Best Days</p>
            <TimeCards items={data.best_days} type="best" />
          </div>
        )}
        {data.recommendations?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FACC15] mb-2">Recommendations</p>
            <Recommendations items={data.recommendations} />
          </div>
        )}
      </div>
    );
  }

  if (agentKey === 'summary') {
    return (
      <div className="space-y-4 pt-4">
        {data.summary && <SummaryCard text={data.summary} />}
        {data.overall_rating && (
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4B5563]">Overall Rating</p>
            <RatingBadge rating={data.overall_rating} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.strengths?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-green-400 mb-2">Strengths</p>
              <CheckList items={data.strengths} type="strength" />
            </div>
          )}
          {data.weaknesses?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400 mb-2">Weaknesses</p>
              <CheckList items={data.weaknesses} type="weakness" />
            </div>
          )}
        </div>
        {data.recommendations?.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#FACC15] mb-2">Recommendations</p>
            <Recommendations items={data.recommendations} />
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-[#FACC15]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export default function AIAnalysisPanel({ results, selectedSignal, isMultiCoin = false, coins = [] }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [agentAnswers, setAgentAnswers] = useState<Record<string, string>>({});
  const [agentStructured, setAgentStructured] = useState<Record<string, any>>({});
  const [agentLoading, setAgentLoading] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const agents = isMultiCoin && coins.length > 1 ? buildMultiAgents(coins) : SINGLE_AGENTS;
  const aiContext = buildAiContext(results, isMultiCoin, coins);

  const runAgent = async (key: string, prompt: string, structured: boolean) => {
    if (agentAnswers[key]) {
      setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
      return;
    }
    setAgentLoading(prev => ({ ...prev, [key]: true }));
    setExpanded(prev => ({ ...prev, [key]: true }));
    try {
      // Pass agent key so backend appends the right schema
      const res = await chatWithResults(prompt, aiContext, undefined, structured ? key : undefined);
      setAgentAnswers(prev => ({ ...prev, [key]: res.answer }));
      if (res.structured) {
        setAgentStructured(prev => ({ ...prev, [key]: res.structured }));
      }
    } catch {
      setAgentAnswers(prev => ({ ...prev, [key]: 'Failed to get analysis. Please try again.' }));
    } finally {
      setAgentLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await chatWithResults(userMsg, aiContext, selectedSignal || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">🤖 AI Analysis</h2>
        {isMultiCoin && coins.length > 1 && (
          <span className="text-[10px] text-[#FACC15] border border-[#FACC15]/30 bg-[#FACC15]/5 px-3 py-1 rounded-full uppercase tracking-widest">
            Comparing {coins.length} coins
          </span>
        )}
      </div>

      {isMultiCoin && coins.length > 1 && (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-xs text-[#4B5563]">
          AI has the full results for{' '}
          <span className="text-white font-semibold">{coins.join(', ')}</span>.
          The agents below compare all coins — not just the one currently displayed.
        </div>
      )}

      {/* Agent sections */}
      <div className="space-y-3">
        {agents.map(agent => (
          <div key={agent.key} className="border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              onClick={() => runAgent(agent.key, agent.prompt, agent.structured ?? false)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{agent.icon}</span>
                <span className="text-white font-semibold text-sm">{agent.title}</span>
                {!agentAnswers[agent.key] && !agentLoading[agent.key] && (
                  <span className="text-[10px] text-[#4B5563] uppercase tracking-widest border border-[#1F1F1F] px-2 py-0.5 rounded">
                    Click to run
                  </span>
                )}
                {agentLoading[agent.key] && (
                  <span className="text-[10px] text-[#FACC15] animate-pulse uppercase tracking-widest">
                    Analysing...
                  </span>
                )}
              </div>
              <span className="text-[#4B5563] text-xs">{expanded[agent.key] ? '▲' : '▼'}</span>
            </button>

            {expanded[agent.key] && (
              <div className="px-5 pb-5 border-t border-[#1F1F1F]">
                {agentLoading[agent.key] ? (
                  <div className="flex items-center gap-3 py-4">
                    <Spinner />
                    <span className="text-[#4B5563] text-sm">Analysing...</span>
                  </div>
                ) : agentStructured[agent.key] ? (
                  // ── Structured beautiful render ──
                  <StructuredResult agentKey={agent.key} data={agentStructured[agent.key]} />
                ) : (
                  // ── Plain text fallback (multi-coin agents or parse failure) ──
                  <p className="text-[#9CA3AF] text-sm leading-relaxed pt-4 whitespace-pre-wrap">
                    {agentAnswers[agent.key]}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat */}
      <div className="border-t border-[#1F1F1F] pt-6">
        <h3 className="text-white font-semibold text-sm mb-1">
          💬 Ask about your results
          {selectedSignal && (
            <span className="ml-2 text-[10px] text-[#FACC15] border border-[#FACC15]/30 px-2 py-0.5 rounded">
              Signal selected
            </span>
          )}
        </h3>
        <p className="text-[10px] text-[#4B5563] mb-4">
          {isMultiCoin
            ? `Ask anything across all ${coins.length} coins e.g. "Which coin had the fewest losing streaks?"`
            : 'Click a signal row first to ask about a specific trade.'}
        </p>

        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-[#4B5563] text-xs text-center py-4">
              {isMultiCoin ? `Ask anything about your ${coins.length}-coin backtest results.` : 'Ask anything about your backtest results.'}
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i}
              className={`rounded-lg p-3 text-sm ${msg.role === 'user'
                ? 'bg-[#FACC15]/10 border border-[#FACC15]/20 text-white ml-8'
                : 'bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF] mr-8'}`}>
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3 mr-8 flex items-center gap-2">
              <Spinner />
              <span className="text-[#4B5563] text-xs">Thinking...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]"
            placeholder={isMultiCoin ? 'e.g. Which coin had the best win rate?' : 'e.g. Which hour had the most wins?'} />
          <button onClick={sendMessage} disabled={chatLoading || !input.trim()}
            className="bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-40 text-black font-bold px-5 py-3 rounded-lg transition-colors text-sm">
            →
          </button>
        </div>
      </div>
    </div>
  );
}