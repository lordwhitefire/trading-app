'use client';

import React, { useEffect, useState } from 'react';
import { getEtfData } from '@/lib/api';

export default function ETFPanel() {
  const [etfData, setEtfData] = useState({});

  useEffect(() => {
    const fetchEtfData = async () => {
      try {
        const response = await getEtfData();
        setEtfData(response);
      } catch (error) {
        console.error('Error fetching ETF data:', error);
      }
    };

    fetchEtfData();
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded">
      <h2>ETF Data</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th>ETF</th>
            <th>Inflow</th>
            <th>Outflow</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(etfData).map((etf, index) => (
            <tr key={index}>
              <td>{etf}</td>
              <td>${etfData[etf].inflow.toFixed(2)}</td>
              <td>${etfData[etf].outflow.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
