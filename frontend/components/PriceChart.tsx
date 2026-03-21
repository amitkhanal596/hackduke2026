"use client";

import { useState, useEffect } from "react";
import { getChartData } from "@/lib/api";
import type { ChartData } from "@/lib/api";
import { X, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps {
  ticker: string;
  period: string;
  onClose: () => void;
}

export default function PriceChart({ ticker, period, onClose }: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getChartData(ticker, period);
        setChartData(data);
      } catch (err: any) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [ticker, period]);

  const formatTooltipValue = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    if (period === "1d") {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (period === "1w") {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-4xl w-full"
          style={{
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
          }}
        >
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-4xl w-full"
          style={{
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
          }}
        >
          <div className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-black text-xl text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-4">{error || "Failed to load chart data"}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform data for recharts
  const chartPoints = chartData.data.map(point => ({
    ...point,
    time: new Date(point.date).getTime(),
    displayTime: formatXAxisLabel(point.date)
  }));

  // Calculate price change for the period
  const firstPrice = chartPoints[0]?.price || 0;
  const lastPrice = chartPoints[chartPoints.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-6xl w-full"
        style={{
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple" />
            <div>
              <h2 className="font-black text-3xl text-white tracking-tight">{ticker}</h2>
              <p className="text-gray-400 font-mono">
                {period === "1d" ? "1 Day" : period === "1w" ? "1 Week" : "1 Month"} Price Chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-purple transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Price Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Open</div>
            <div className="text-xl font-mono font-bold text-white">
              ${firstPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Current</div>
            <div className="text-xl font-mono font-bold text-white">
              ${lastPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-sm text-gray-400 mb-1">Change</div>
            <div className={`text-xl font-mono font-bold ${isPositive ? "text-chartGreen" : "text-chartRed"}`}>
              {isPositive ? "+" : ""}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-96 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="displayTime"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: number) => [formatTooltipValue(value), 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#8B5CF6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Data provided by Yahoo Finance • {chartData.data.length} data points
          </p>
        </div>
      </div>
    </div>
  );
}
