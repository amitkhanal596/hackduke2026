"use client";

import { useState } from "react";
import { getBullBearAnalysis, type BullBearAnalysis } from "@/lib/api";
import { TrendingUp, TrendingDown, Loader2, X, RefreshCw } from "lucide-react";

interface BullBearAnalysisPanelProps {
  ticker: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BullBearAnalysisPanel({
  ticker,
  isOpen,
  onClose,
}: BullBearAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<BullBearAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBullBearAnalysis(ticker);
      setAnalysis(data);
    } catch (err) {
      setError("Failed to generate analysis. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when opened
  useState(() => {
    if (isOpen && !analysis) {
      fetchAnalysis();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-black/90 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-white/10 bg-black/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {ticker} <span className="text-gray-400 font-light">SENTIMENT</span>
            </h2>
            <span className="px-2 py-1 bg-purple/20 text-purple text-xs rounded border border-purple/30 font-mono">
              AI-POWERED
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-purple animate-spin" />
              <p className="text-gray-400 animate-pulse">Analyzing {ticker} market data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchAnalysis}
                className="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple/80 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-8">
              {/* Gauge */}
              <div className="relative h-12 bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-1000 ease-out flex items-center justify-start pl-4"
                  style={{ width: `${analysis.bull_percentage}%` }}
                >
                  {analysis.bull_percentage > 15 && (
                    <span className="font-bold text-black text-sm md:text-base whitespace-nowrap">
                      🐂 BULL {analysis.bull_percentage}%
                    </span>
                  )}
                </div>
                <div 
                  className="bg-gradient-to-l from-red-500 to-rose-400 h-full transition-all duration-1000 ease-out flex items-center justify-end pr-4"
                  style={{ width: `${analysis.bear_percentage}%` }}
                >
                  {analysis.bear_percentage > 15 && (
                    <span className="font-bold text-white text-sm md:text-base whitespace-nowrap">
                      🐻 BEAR {analysis.bear_percentage}%
                    </span>
                  )}
                </div>
                
                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/50 z-10"></div>
              </div>

              {/* Analysis Text */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  Key Insights
                  {analysis.bull_percentage >= analysis.bear_percentage ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {analysis.analysis}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={fetchAnalysis}
                  className="text-gray-500 hover:text-purple text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh Analysis
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
