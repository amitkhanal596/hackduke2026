"use client";

import { useState, useEffect } from "react";
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
  useEffect(() => {
    if (isOpen && !analysis) {
      fetchAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Parse the analysis text to extract components
  const parseAnalysis = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const verdict = lines[0] || "NEUTRAL";
    const percentages = lines[1] || "";
    const explanation = lines[2] || "";
    const factors = lines.slice(4).filter(line => line.includes('•'));

    return { verdict, percentages, explanation, factors };
  };

  const { verdict, percentages, explanation, factors } = analysis
    ? parseAnalysis(analysis.analysis)
    : { verdict: "", percentages: "", explanation: "", factors: [] };

  // Determine verdict color
  const getVerdictColor = (v: string) => {
    if (v.includes('AGGRESSIVE BULLISH')) return 'text-emerald-300';
    if (v.includes('BULLISH')) return 'text-emerald-400';
    if (v.includes('LEANING BULLISH')) return 'text-emerald-500';
    if (v.includes('AGGRESSIVE BEARISH')) return 'text-red-300';
    if (v.includes('BEARISH')) return 'text-red-400';
    if (v.includes('LEANING BEARISH')) return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div
        className="bg-black/95 border border-emerald-500/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(16,185,129,0.15)] relative"
        style={{
          boxShadow: '0 0 50px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)'
        }}
      >
        {/* Terminal Header */}
        <div className="sticky top-0 z-10 border-b border-emerald-500/20 bg-black/98 backdrop-blur-md">
          {/* Terminal Top Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/10">
            <div className="flex items-center gap-2 text-emerald-500/50 text-xs font-mono">
              <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/70"></span>
              <span className="ml-4">QUANT_ENGINE_V2.exe</span>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-500/50 hover:text-emerald-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-emerald-500 font-mono text-sm animate-pulse">▶</span>
              <h2 className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                {ticker}
              </h2>
              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/30 font-mono">
                SENTIMENT_ANALYSIS
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                <div className="absolute inset-0 w-16 h-16 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-emerald-400 font-mono animate-pulse">ANALYZING MARKET DATA...</p>
                <p className="text-emerald-500/50 font-mono text-xs">
                  [PROCESSING: {ticker} | STATUS: ACTIVE]
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-red-400 font-mono text-sm">[ERROR]: {error}</p>
              <button
                onClick={fetchAnalysis}
                className="px-6 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all flex items-center gap-2 mx-auto font-mono text-sm shadow-[0_0_20px_rgba(16,185,129,0.1)]"
              >
                <RefreshCw className="w-4 h-4" /> RETRY
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Gauge */}
              <div className="relative h-14 bg-black border border-emerald-500/20 rounded-lg overflow-hidden flex shadow-inner">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full flex items-center justify-start pl-4 relative"
                  style={{ width: `${analysis.bull_percentage}%` }}
                >
                  {analysis.bull_percentage > 15 && (
                    <span className="font-bold text-black text-sm md:text-base whitespace-nowrap font-mono z-10">
                      🐂 BULL {analysis.bull_percentage}%
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-emerald-400/30"></div>
                </div>
                <div
                  className="bg-gradient-to-l from-red-500 to-red-400 h-full flex items-center justify-end pr-4 relative"
                  style={{ width: `${analysis.bear_percentage}%` }}
                >
                  {analysis.bear_percentage > 15 && (
                    <span className="font-bold text-white text-sm md:text-base whitespace-nowrap font-mono z-10">
                      🐻 BEAR {analysis.bear_percentage}%
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-red-400/30"></div>
                </div>

                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-emerald-500/50 z-10"></div>
              </div>

              {/* Verdict Display */}
              <div className="bg-black/50 border border-emerald-500/20 rounded-lg p-6 space-y-4 relative overflow-hidden">
                {/* Subtle animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent animate-pulse"></div>

                <div className="relative z-10 space-y-4">
                  {/* Verdict */}
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500 font-mono text-xs">[VERDICT]</span>
                    <h3 className={`text-2xl font-black tracking-tight font-mono ${getVerdictColor(verdict)}`}>
                      {verdict}
                    </h3>
                    {analysis.bull_percentage >= analysis.bear_percentage ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  {/* Percentages */}
                  <div className="font-mono text-emerald-400/70 text-sm">
                    {percentages}
                  </div>

                  {/* Explanation */}
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {explanation}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-emerald-500/20 my-4"></div>

                  {/* Factors */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-500 font-mono text-xs">[FACTOR_ANALYSIS]</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {factors.map((factor, idx) => {
                        const cleanFactor = factor.replace('•', '').trim();
                        const [name, score] = cleanFactor.split(':');
                        const scoreNum = parseInt(score?.replace('/100', '')) || 50;

                        return (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 font-mono">{name?.trim()}</span>
                              <span className="text-emerald-400 font-mono font-bold">{score?.trim()}</span>
                            </div>
                            <div className="h-1.5 bg-black border border-emerald-500/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out rounded-full"
                                style={{ width: `${scoreNum}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="text-center pt-2">
                <button
                  onClick={fetchAnalysis}
                  className="text-emerald-500/50 hover:text-emerald-400 text-xs flex items-center justify-center gap-2 mx-auto transition-colors font-mono group"
                >
                  <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                  [REFRESH_ANALYSIS]
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
