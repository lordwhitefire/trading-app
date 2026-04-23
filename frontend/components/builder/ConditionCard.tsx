'use client';

import React from 'react';

interface ConditionCardProps {
  indicator: string;
  operator: string;
  value: number;
  period?: number;
  explanation: string;
  onRemove: () => void;
  onChange: (field: string, value: any) => void;
}

export default function ConditionCard({ indicator, operator, value, period, explanation, onRemove, onChange }: ConditionCardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded mb-2 flex items-center justify-between">
      <div>
        <p>{indicator}</p>
        <select
          value={operator}
          onChange={(e) => onChange('operator', e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="greater_than">Greater Than</option>
          <option value="less_than">Less Than</option>
          <option value="crosses_above">Crosses Above</option>
          <option value="crosses_below">Crosses Below</option>
        </select>
        {period && (
          <input
            type="number"
            value={period}
            onChange={(e) => onChange('period', parseInt(e.target.value))}
            className="border rounded px-2 py-1 ml-2"
            placeholder="Period"
          />
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange('value', parseFloat(e.target.value))}
          className="border rounded px-2 py-1 ml-2"
          placeholder="Value"
        />
      </div>
      <button onClick={onRemove} className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">
        Remove
      </button>
    </div>
  );
}
