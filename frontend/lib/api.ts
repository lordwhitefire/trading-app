import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const BYBIT_PROXY = 'https://bybit-proxy.alphadeskproxy.workers.dev';


export const translateStrategy = async (text: string) => {
  const response = await apiClient.post('/api/translator/', { text });
  return response.data;
};

export const runBacktest = async (strategy: object) => {
  const response = await apiClient.post('/api/backtest/', strategy);
  return response.data;
};

export const getLiveSignal = async (strategy: object) => {
  const response = await apiClient.post('/api/live/', strategy);
  return response.data;
};

export const getNews = async (coin: string) => {
  const response = await apiClient.get(`/api/news/${coin}`);
  return response.data;
};

export const getEtfData = async () => {
  const response = await apiClient.get('/api/etf/');
  return response.data;
};

export const getAvailableIndicators = async () => {
  const response = await apiClient.get('/api/indicators');
  return response.data;
};

export const getAvailablePatterns = async () => {
  const response = await apiClient.get('/api/patterns');
  return response.data;
};

export const getAvailableLevels = async () => {
  const response = await apiClient.get('/api/levels');
  return response.data;
};

export const getStrategyWarnings = async (strategy: object) => {
  const response = await apiClient.post('/api/warnings/', strategy);
  return response.data;
};

export const getMaxStopLoss = async (leverage: number) => {
  const response = await apiClient.get(`/api/warnings/max-stop-loss/${leverage}`);
  return response.data;
};

export const getAvailableCoins = async () => {
  const response = await apiClient.get('/api/coins');
  return response.data;
};

export const chatWithResults = async (
  question: string,
  results: object,
  signal?: object,
  agent?: string
) => {
  const response = await apiClient.post('/api/chat/', {
    question,
    results,
    signal: signal || null,
    agent: agent || null,
  });
  return response.data;
};

export const getDevicePrices = async () => {
  const response = await apiClient.get('/api/device/prices');
  return response.data;
};

export const getDevicePositions = async () => {
  const response = await apiClient.get('/api/device/positions');
  return response.data;
};
