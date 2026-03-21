"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

interface StockPillProps {
  ticker: string;
  onRemove: () => void;
  onViewDetails?: () => void;
}

interface StockData {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
}

export default function StockPill({ ticker, onRemove, onViewDetails }: StockPillProps) {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStockData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => fetchStockData(true), 30000);
    
    return () => clearInterval(interval);
  }, [ticker]);

  const fetchStockData = async (isUpdate = false) => {
    try {
      if (isUpdate) {
        setUpdating(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Simulate API call - replace with actual API endpoint
      const response = await fetch(`/api/stock-data?ticker=${ticker}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load data');
      // Set mock data for demo purposes
      setStockData({
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 10000000),
        marketCap: `${(Math.random() * 1000 + 100).toFixed(0)}B`
      });
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}`;
  const formatChangePercent = (percent: number) => `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;

  const isPositive = stockData?.change && stockData.change >= 0;
  const isNegative = stockData?.change && stockData.change < 0;

  return (
    <div className="group relative flex items-center gap-2">
      <div 
        className="flex-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 hover:border-green/50 transition-all duration-200 cursor-pointer"
        onClick={onViewDetails}
        style={{
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.05), inset 0 0 10px rgba(16, 185, 129, 0.02)'
        }}
      >
        <div className="flex items-center gap-3">
          {/* Ticker */}
          <div className="font-mono font-bold text-lg text-white">
            {ticker}
          </div>

          {/* Price Data */}
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : error ? (
            <span className="text-red-400 text-xs">Error</span>
          ) : stockData ? (
            <div className="flex items-center gap-2">
              {/* Price */}
              <span className="font-semibold text-base text-white flex items-center gap-1">
                {formatPrice(stockData.price)}
                {updating && <Loader2 className="w-3 h-3 animate-spin text-green" />}
              </span>

              {/* Change */}
              <div className={`flex items-center gap-1 text-sm ${
                isPositive ? 'text-green-400' : 
                isNegative ? 'text-red-400' : 
                'text-gray-400'
              }`}>
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNegative ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                <span>
                  {formatChange(stockData.change)} ({formatChangePercent(stockData.changePercent)})
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-green/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Remove Button - Separate from pill */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('X button clicked for ticker:', ticker);
          onRemove();
        }}
        className="opacity-70 hover:opacity-100 transition-all duration-200 p-2 hover:bg-red-500/20 rounded-full hover:scale-110 z-10"
        title="Remove stock"
      >
        <X className="w-4 h-4 text-red-400 hover:text-red-300" />
      </button>
    </div>
  );
}
