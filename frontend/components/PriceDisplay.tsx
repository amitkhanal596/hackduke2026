"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getPriceData } from "@/lib/api";
import type { PriceData } from "@/lib/api";
import { TrendingUp, TrendingDown, DollarSign, X, BarChart3 } from "lucide-react";
import PriceChart from "./PriceChart";

interface PriceDisplayProps {
  ticker: string;
  onClose: () => void;
}

export default function PriceDisplay({ ticker, onClose }: PriceDisplayProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPriceData(ticker);
        setPriceData(data);
      } catch (err: any) {
        console.error("Error fetching price data:", err);
        if (err.response?.status === 404) {
          setError(`Stock ticker "${ticker}" not found. Please check the ticker symbol.`);
        } else if (err.response?.status === 500) {
          setError("Server error while fetching price data. Please try again later.");
        } else {
          setError("Failed to fetch price data. Please check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [ticker]);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, percent: number) => {
    const isPositive = change >= 0;
    const sign = isPositive ? "+" : "";
    return {
      value: `${sign}${change.toFixed(2)}`,
      percent: `${sign}${percent.toFixed(2)}%`,
      isPositive
    };
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-md w-full"
          style={{
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
          }}
        >
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading price data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div 
          className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-md w-full"
          style={{
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
          }}
        >
          <div className="text-center">
            <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-black text-xl text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-4">{error || "Failed to load price data"}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  // Retry the fetch
                  getPriceData(ticker)
                    .then(setPriceData)
                    .catch((err: any) => {
                      console.error("Retry error:", err);
                      if (err.response?.status === 404) {
                        setError(`Stock ticker "${ticker}" not found. Please check the ticker symbol.`);
                      } else if (err.response?.status === 500) {
                        setError("Server error while fetching price data. Please try again later.");
                      } else {
                        setError("Failed to fetch price data. Please check your connection and try again.");
                      }
                    })
                    .finally(() => setLoading(false));
                }}
                className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/90 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentChange = formatChange(priceData.change_1d, priceData.change_1d_percent);
  const weekChange = formatChange(priceData.change_1w, priceData.change_1w_percent);
  const monthChange = formatChange(priceData.change_1m, priceData.change_1m_percent);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 max-w-2xl w-full"
        style={{
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-purple" />
            <h2 className="font-black text-3xl text-white tracking-tight">{ticker}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-purple transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Price */}
        <div className="text-center mb-8">
          <div className="text-5xl font-black text-white mb-2">
            {formatPrice(priceData.current_price)}
          </div>
          <div className={`flex items-center justify-center gap-2 text-xl font-mono ${
            currentChange.isPositive ? "text-chartGreen" : "text-chartRed"
          }`}>
            {currentChange.isPositive ? (
              <TrendingUp className="w-6 h-6" />
            ) : (
              <TrendingDown className="w-6 h-6" />
            )}
            <span>{currentChange.value}</span>
            <span>({currentChange.percent})</span>
          </div>
        </div>

        {/* Price Changes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1 Day */}
          <button
            onClick={() => setShowChart("1d")}
            className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-purple/50 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-white tracking-tight">1 DAY</h3>
              <BarChart3 className="w-5 h-5 text-purple opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className={`text-2xl font-mono font-bold mb-2 ${
              currentChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {currentChange.value}
            </div>
            <div className={`text-sm font-mono ${
              currentChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {currentChange.percent}
            </div>
            <div className="text-xs text-gray-400 mt-2 group-hover:text-purple transition-colors">
              Click to view chart
            </div>
          </button>

          {/* 1 Week */}
          <button
            onClick={() => setShowChart("1w")}
            className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-purple/50 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-white tracking-tight">1 WEEK</h3>
              <BarChart3 className="w-5 h-5 text-purple opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className={`text-2xl font-mono font-bold mb-2 ${
              weekChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {weekChange.value}
            </div>
            <div className={`text-sm font-mono ${
              weekChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {weekChange.percent}
            </div>
            <div className="text-xs text-gray-400 mt-2 group-hover:text-purple transition-colors">
              Click to view chart
            </div>
          </button>

          {/* 1 Month */}
          <button
            onClick={() => setShowChart("1m")}
            className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-purple/50 hover:bg-white/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-white tracking-tight">1 MONTH</h3>
              <BarChart3 className="w-5 h-5 text-purple opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className={`text-2xl font-mono font-bold mb-2 ${
              monthChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {monthChange.value}
            </div>
            <div className={`text-sm font-mono ${
              monthChange.isPositive ? "text-chartGreen" : "text-chartRed"
            }`}>
              {monthChange.percent}
            </div>
            <div className="text-xs text-gray-400 mt-2 group-hover:text-purple transition-colors">
              Click to view chart
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Data provided by Yahoo Finance
          </p>
        </div>
      </div>

      {/* Chart Modal */}
      {showChart && typeof document !== 'undefined' && createPortal(
        <PriceChart
          ticker={ticker}
          period={showChart}
          onClose={() => setShowChart(null)}
        />,
        document.body
      )}
    </div>
  );
}
