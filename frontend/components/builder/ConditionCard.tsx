'use client';
import React from 'react';

interface ConditionCardProps {
  index: number;
  indicator: string;
  operator: string;
  value: string;
  onRemove: () => void;
  onChange: (field: string, value: string) => void;
  availableIndicators?: string[];
}

const OPERATORS = ['<', '>', '=', 'crosses above', 'crosses below'];

export default function ConditionCard({ index, indicator, operator, value, onRemove, onChange, availableIndicators = [] }: ConditionCardProps) {
  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#FACC15] border border-[#FACC15]/30 bg-[#FACC15]/10 px-2 py-0.5 rounded">
          Condition {String(index + 1).padStart(2, '0')}
        </span>
        <button onClick={onRemove} className="text-red-500/60 hover:text-red-500 transition-colors p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={indicator}
          onChange={(e) => onChange('indicator', e.target.value)}
          className="bg-[#0D0D0D] border border-[#1F1F1F] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer"
        >
          {availableIndicators.length > 0 ? (
            availableIndicators.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))
          ) : (
            <option value={indicator}>{indicator}</option>
          )}
        </select>
        <select
          value={operator}
          onChange={(e) => onChange('operator', e.target.value)}
          className="bg-[#0D0D0D] border border-[#1F1F1F] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors appearance-none cursor-pointer"
        >
          {OPERATORS.map((op) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange('value', e.target.value)}
          className="bg-[#0D0D0D] border border-[#1F1F1F] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-[#FACC15] transition-colors"
          placeholder="Value"
        />
      </div>
    </div>
  );
}