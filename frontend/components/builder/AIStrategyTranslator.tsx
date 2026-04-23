'use client';

import React, { useState } from 'react';
import { translateStrategy } from '@/lib/api';
import ConditionCard from './ConditionCard';

export default function AIStrategyTranslator() {
  const [text, setText] = useState('');
  const [conditions, setConditions] = useState([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const response = await translateStrategy(text);
      setConditions(response.conditions);
      setSummary(response.summary);
    } catch (error) {
      console.error('Error translating strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-4 border rounded mb-4"
        placeholder="Type your trading strategy in plain English..."
      />
      <button onClick={handleTranslate} disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">
        {loading ? 'Translating...' : 'Translate Strategy'}
      </button>
      {conditions.length > 0 && (
        <div className="mt-8">
          <h2>Conditions</h2>
          {conditions.map((condition, index) => (
            <ConditionCard
              key={index}
              indicator={condition.indicator}
              operator={condition.operator}
              value={condition.value}
              period={condition.period}
              explanation={condition.explanation}
              onRemove={() => {}}
              onChange={() => {}}
            />
          ))}
        </div>
      )}
      {summary && (
        <div className="mt-8 bg-gray-800 p-4 rounded">
          <h2>Summary</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}
