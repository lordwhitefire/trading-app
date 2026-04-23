'use client';

import React, { useState } from 'react';
import { translateStrategy } from '@/lib/api';

interface AIStrategyTranslatorProps {
  onConditionsGenerated?: (conditions: any[]) => void;
}

export default function AIStrategyTranslator({ onConditionsGenerated }: AIStrategyTranslatorProps) {
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setSummary('');
    try {
      const response = await translateStrategy(text);
      setSummary(response.summary || '');
      if (onConditionsGenerated && response.conditions) {
        onConditionsGenerated(response.conditions);
      }
    } catch (err) {
      setError('Failed to translate strategy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-xl p-6">
      <h2 className="text-white font-bold text-xl mb-1 flex items-center gap-2">
        <span>✨</span> AI Strategy Translator
      </h2>
      <p className="text-[#4B5563] text-sm mb-4">
        Describe your strategy in plain English and AI will generate the conditions
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Describe your strategy in plain English... (e.g., Buy BTC when RSI is below 30 and price is above 200 EMA)"
        className="w-full bg-[#111111] border border-[#1F1F1F] text-white placeholder:text-[#4B5563] rounded-lg p-4 text-sm resize-none focus:outline-none focus:border-[#FACC15] transition-colors"
      />

      <button
        onClick={handleTranslate}
        disabled={loading || !text.trim()}
        className="w-full mt-3 bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Translating...
          </>
        ) : (
          'TRANSLATE →'
        )}
      </button>

      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <div className="mt-4 bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-[10px] text-[#4B5563] uppercase tracking-widest font-semibold mb-2">AI Summary</p>
          <p className="text-[#9CA3AF] text-sm leading-relaxed">{summary}</p>
        </div>
      )}
    </div>
  );
}