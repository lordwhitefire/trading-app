'use client';

import React from 'react';

interface AIExplanationPanelProps {
  explanation: string;
}

export default function AIExplanationPanel({ explanation }: AIExplanationPanelProps) {
  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2>AI Explanation</h2>
      <p>{explanation}</p>
    </div>
  );
}
