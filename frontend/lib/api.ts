import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const translateStrategy = async (text: string) => {
  const response = await apiClient.post('/api/translator', { text });
  return response.data;
};

export const runBacktest = async (strategy: object) => {
  const response = await apiClient.post('/api/backtest', strategy);
  return response.data;
};

export const getLiveSignal = async (strategy: object) => {
  const response = await apiClient.post('/api/live', strategy);
  return response.data;
};

export const getNews = async (coin: string) => {
  const response = await apiClient.get(`/api/news/${coin}`);
  return response.data;
};

export const getEtfData = async () => {
  const response = await apiClient.get('/api/etf');
  return response.data;
};
