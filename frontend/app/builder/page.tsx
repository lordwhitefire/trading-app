import React from 'react';
import StrategyForm from '@/components/builder/StrategyForm';
import AIStrategyTranslator from '@/components/builder/AIStrategyTranslator';

export default function BuilderPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Strategy Builder</h1>
      <StrategyForm />
      <AIStrategyTranslator />
    </div>
  );
}
