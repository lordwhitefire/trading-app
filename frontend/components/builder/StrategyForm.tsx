'use client';

import React, { useState } from 'react';
import { runBacktest } from '@/lib/api';
import ConditionCard from './ConditionCard';
import IndicatorPanel from './IndicatorPanel';
import { useStore } from '@/lib/store';

export default function StrategyForm() {
  const [strategyName, setStrategyName] = useState('');
  const [coin, setCoin] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1h');
  const [backtestPeriod, setBacktestPeriod] = useState(7);
  const [tradeDuration, setTradeDuration] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [logic, setLogic] = useState('AND');
  const [conditions, setConditions] = useState([]);
  const { addStrategy, setBacktestResults } = useStore();
  const [loading, setLoading] = useState(false);

  const handleAddCondition = () => {
    setConditions([...conditions, { indicator: '', operator: 'greater_than', value: 0 }]);
  };

  const handleRemoveCondition = (index) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  const handleChangeCondition = (index, field, value) => {
    const newConditions = [...conditions];
    newConditions[index][field] = value;
    setConditions(newConditions);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const strategy = {
        name: strategyName,
        coin,
        timeframe,
        backtestPeriod,
        tradeDuration,
        stopLoss,
        logic,
        conditions
      };
      const results = await runBacktest(strategy);
      setBacktestResults(results);
      addStrategy(strategy);
    } catch (error) {
      console.error('Error running backtest:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Strategy Form</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="mb-4">
          <label htmlFor="strategyName" className="block text-sm font-medium text-gray-700">Strategy Name:</label>
          <input
            id="strategyName"
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="coin" className="block text-sm font-medium text-gray-700">Coin:</label>
          <select
            id="coin"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="SOL">SOL</option>
            <option value="BNB">BNB</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700">Timeframe:</label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          >
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
        </div>
        <div className="mb-4">
          <label htmlFor="backtestPeriod" className="block text-sm font-medium text-gray-700">Backtest Period (days):</label>
          <input
            id="backtestPeriod"
            type="number"
            value={backtestPeriod}
            onChange={(e) => setBacktestPeriod(parseInt(e.target.value))}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="tradeDuration" className="block text-sm font-medium text-gray-700">Trade Duration:</label>
          <input
            id="tradeDuration"
            value={tradeDuration}
            onChange={(e) => setTradeDuration(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-700">Stop Loss:</label>
          <input
            id="stopLoss"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="logic" className="block text-sm font-medium text-gray-700">Logic:</label>
          <select
            id="logic"
            value={logic}
            onChange={(e) => setLogic(e.target.value)}
            className="mt-1 block w-full border rounded-md shadow-sm sm:text-sm"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
        <h3>Conditions</h3>
        {conditions.map((condition, index) => (
          <ConditionCard
            key={index}
            indicator={condition.indicator}
            operator={condition.operator}
            value={condition.value}
            period={condition.period}
            explanation=""
            onRemove={() => handleRemoveCondition(index)}
            onChange={(field, value) => handleChangeCondition(index, field, value)}
          />
        ))}
        <button type="button" onClick={handleAddCondition} className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4">
          Add Condition
        </button>
        <div className="mt-8">
          <button type="submit" onClick={handleSubmit} disabled={loading} className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded">
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </button>
        </div>
      </form>
    </div>
  );
}
