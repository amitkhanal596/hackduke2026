import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface NewsArticle {
  ticker: string;
  title: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  url: string;
  published_at: string;
}

export interface EventAnalysis {
  ticker: string;
  event: string;
  date: string;
  car_0_1: number;
  volatility_change: number;
  sentiment: string;
  conclusion: string;
}

export interface UpcomingEvent {
  ticker: string;
  type: string;
  date: string;
  expected_impact: string;
}

export interface PriceData {
  ticker: string;
  current_price: number;
  change_1d: number;
  change_1w: number;
  change_1m: number;
  change_1d_percent: number;
  change_1w_percent: number;
  change_1m_percent: number;
}

export interface ChartDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface ChartData {
  ticker: string;
  period: string;
  data: ChartDataPoint[];
}

export const addTicker = async (ticker: string) => {
  const response = await api.post('/add_ticker', { ticker });
  return response.data;
};

export const fetchNews = async (tickers: string[]) => {
  const response = await api.post<NewsArticle[]>('/fetch_news', { tickers });
  return response.data;
};

export const analyzeEvent = async (ticker: string, date: string) => {
  const response = await api.post<EventAnalysis>('/analyze_event', { ticker, date });
  return response.data;
};

export const getPastEvents = async (ticker: string) => {
  const response = await api.get<EventAnalysis[]>(`/events/past?ticker=${ticker}`);
  return response.data;
};

export const getUpcomingEvents = async (ticker: string) => {
  const response = await api.get<UpcomingEvent[]>(`/events/upcoming?ticker=${ticker}`);
  return response.data;
};

export const getPriceData = async (ticker: string) => {
  const response = await api.get<PriceData>(`/price/${ticker}`);
  return response.data;
};

export const getChartData = async (ticker: string, period: string) => {
  const response = await api.get<ChartData>(`/chart/${ticker}/${period}`);
  return response.data;
};

export const explainSentiment = async (article: NewsArticle) => {
  const response = await api.post<{ session_id: string; reply: string }>('/agent/explain-sentiment', { article });
  return response.data;
};

export default api;
