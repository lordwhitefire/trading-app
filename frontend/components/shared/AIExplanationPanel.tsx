'use client';

import React, { useState } from 'react';
import { chatWithResults } from '@/lib/api';

interface Props {
  results: any;
  selectedSignal?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AGENT_SECTIONS = [
  {
    key: 'indicator',
    icon: '📊',
    title: 'Indicator Analyst',
    prompt: 'Analyze which indicators in this strategy contributed most to wins vs losses. Be specific about indicator performance.',
  },
  {
    key: 'time',
    icon: '🕐',
    title: 'Time Analyst',
    prompt: 'Analyze the time-based performance patterns in these results. Which hours and days had the best and worst performance?',
  },
  {
    key: 'summary',
    icon: '🧠',
    title: 'Strategy Summary',
    prompt: 'Give an overall assessment of this trading strategy based on the backtest results. What are the strengths, weaknesses, and recommendations?',
  },
];

export default function AIAnalysisPanel({ results, selectedSignal }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [agentAnswers, setAgentAnswers] = useState<Record<string, string>>({});
  const [agentLoading, setAgentLoading] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const runAgent = async (key: string, prompt: string) => {
    if (agentAnswers[key]) {
      setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
      return;
    }
    setAgentLoading(prev => ({ ...prev, [key]: true }));
    setExpanded(prev => ({ ...prev, [key]: true }));
    try {
      const res = await chatWithResults(prompt, results);
      setAgentAnswers(prev => ({ ...prev, [key]: res.answer }));
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
      const res = await chatWithResults(userMsg, results, selectedSignal || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6 space-y-6">
      <h2 className="text-white font-bold text-lg">🤖 AI Analysis</h2>

      {/* Agent sections */}
      <div className="space-y-3">
        {AGENT_SECTIONS.map(agent => (
          <div key={agent.key} className="border border-[#1F1F1F] rounded-xl overflow-hidden">
            <button
              onClick={() => runAgent(agent.key, agent.prompt)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#111111] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{agent.icon}</span>
                <span className="text-white font-semibold text-sm">{agent.title}</span>
                {!agentAnswers[agent.key] && (
                  <span className="text-[10px] text-[#4B5563] uppercase tracking-widest border border-[#1F1F1F] px-2 py-0.5 rounded">
                    Click to run
                  </span>
                )}
              </div>
              <span className="text-[#4B5563] text-xs">
                {expanded[agent.key] ? '▲' : '▼'}
              </span>
            </button>

            {expanded[agent.key] && (
              <div className="px-5 pb-5 border-t border-[#1F1F1F]">
                {agentLoading[agent.key] ? (
                  <div className="flex items-center gap-3 py-4">
                    <svg className="animate-spin w-4 h-4 text-[#FACC15]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span className="text-[#4B5563] text-sm">Analysing...</span>
                  </div>
                ) : (
                  <p className="text-[#9CA3AF] text-sm leading-relaxed pt-4">
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
        <h3 className="text-white font-semibold text-sm mb-4">
          💬 Ask about your results
          {selectedSignal && (
            <span className="ml-2 text-[10px] text-[#FACC15] border border-[#FACC15]/30 px-2 py-0.5 rounded">
              Signal selected
            </span>
          )}
        </h3>

        {/* Messages */}
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.length === 0 && (
            <p className="text-[#4B5563] text-xs text-center py-4">
              Ask anything about your backtest results. Click a signal row first to ask about a specific trade.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${msg.role === 'user'
                  ? 'bg-[#FACC15]/10 border border-[#FACC15]/20 text-white ml-8'
                  : 'bg-[#111111] border border-[#1F1F1F] text-[#9CA3AF] mr-8'
                }`}
            >
              {msg.content}
            </div>
          ))}
          {chatLoading && (
            <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3 mr-8 flex items-center gap-2">
              <svg className="animate-spin w-3 h-3 text-[#FACC15]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-[#4B5563] text-xs">Thinking...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 bg-[#111111] border border-[#1F1F1F] text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-[#FACC15] transition-colors placeholder:text-[#4B5563]"
            placeholder="e.g. Which hour had the most wins?"
          />
          <button
            onClick={sendMessage}
            disabled={chatLoading || !input.trim()}
            className="bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-40 text-black font-bold px-5 py-3 rounded-lg transition-colors text-sm"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}