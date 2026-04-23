'use client';

import React, { useState } from 'react';
import StrategyForm from '@/components/builder/StrategyForm';
import AIStrategyTranslator from '@/components/builder/AIStrategyTranslator';

export default function BuilderPage() {
  const [aiConditions, setAiConditions] = useState([]);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Desktop: two columns | Mobile: single column stacked (AI on top, form below) */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

        {/* Left column — Strategy Form (desktop), shown second on mobile */}
        <div className="w-full lg:w-1/2 order-2 lg:order-1">
          <StrategyForm externalConditions={aiConditions} />
        </div>

        {/* Right column — AI Translator (desktop), shown first on mobile */}
        <div className="w-full lg:w-1/2 order-1 lg:order-2 lg:sticky lg:top-24">
          <AIStrategyTranslator onConditionsGenerated={setAiConditions} />
        </div>

      </div>
    </div>
  );
}