'use client';

import React, { useEffect, useState } from 'react';
import { getAvailableIndicators } from '@/lib/api';

interface IndicatorPanelProps {
  onAddIndicator: (indicator: string) => void;
}

export default function IndicatorPanel({ onAddIndicator }: IndicatorPanelProps) {
  const [indicators, setIndicators] = useState<string[]>([]);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await getAvailableIndicators();
        setIndicators(response.indicators);
      } catch (error) {
        console.error('Error fetching indicators:', error);
      }
    };

    fetchIndicators();
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded mb-4">
      <h2>Available Indicators</h2>
      <div className="flex flex-wrap gap-2">
        {indicators.map((indicator) => (
          <button
            key={indicator}
            onClick={() => onAddIndicator(indicator)}
            className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {indicator}
          </button>
        ))}
      </div>
    </div>
  );
}
