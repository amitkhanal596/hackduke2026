"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Loader2, Shield, Brain } from "lucide-react";

interface BullBearAnalysisProps {
  ticker: string;
}

interface AnalysisData {
  security: {
    sanitized: boolean;
    clean_data_preview: string;
  };
  bull_case: {
    points: string[];
    score: number;
    confidence: string;
  };
  bear_case: {
    points: string[];
    score: number;
    confidence: string;
  };
  final_recommendation: {
    bull_percentage: number;
    bear_percentage: number;
    recommendation: string;
    summary: string;
  };
  ticker: string;
  analyzed_at: string;
}

export default function BullBearAnalysis({ ticker }: BullBearAnalysisProps) {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/analyze/${ticker}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError('Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [ticker]);

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Hold':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Avoid':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-500/20 text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      low: 'bg-red-500/20 text-red-400',
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple" />
          <div className="text-center">
            <p className="text-white font-semibold">Analyzing {ticker}...</p>
            <p className="text-gray-400 text-sm mt-1">
              Running multi-agent analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-lg p-6">
        <p className="text-red-400">
          {error || 'No analysis available'}
        </p>
        <button
          onClick={fetchAnalysis}
          className="mt-4 px-4 py-2 bg-purple hover:bg-purple/80 text-white rounded-md transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Badge */}
      {analysis.security.sanitized && (
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Secured & Sanitized</span>
        </div>
      )}

      {/* Final Recommendation */}
      <div className="bg-gradient-to-r from-purple/10 to-green/10 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-purple" />
          <h3 className="text-xl font-bold text-white">AI Recommendation</h3>
        </div>

        <div
          className={`inline-block px-6 py-3 rounded-full border-2 font-bold text-lg mb-4 ${getRecommendationColor(
            analysis.final_recommendation.recommendation
          )}`}
        >
          {analysis.final_recommendation.recommendation}
        </div>

        <p className="text-gray-300 mb-4">
          {analysis.final_recommendation.summary}
        </p>

        {/* Percentage Bar */}
        <div className="relative h-12 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-start px-4"
            style={{ width: `${analysis.final_recommendation.bull_percentage}%` }}
          >
            <span className="text-white font-bold text-sm flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {analysis.final_recommendation.bull_percentage}%
            </span>
          </div>
          <div
            className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 flex items-center justify-end px-4"
            style={{ width: `${analysis.final_recommendation.bear_percentage}%` }}
          >
            <span className="text-white font-bold text-sm flex items-center gap-1">
              {analysis.final_recommendation.bear_percentage}%
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Historical Strengths */}
      <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">Historical Strengths</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-400">
              {analysis.bull_case.score}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceBadge(
                analysis.bull_case.confidence
              )}`}
            >
              {analysis.bull_case.confidence}
            </span>
          </div>
        </div>
        <ul className="space-y-2">
          {analysis.bull_case.points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-gray-300">
              <span className="text-green-400 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Forward Risks */}
      <div className="bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-red-400">Forward Outlook & Risks</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-400">
              {analysis.bear_case.score}
            </span>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceBadge(
                analysis.bear_case.confidence
              )}`}
            >
              {analysis.bear_case.confidence}
            </span>
          </div>
        </div>
        <ul className="space-y-2">
          {analysis.bear_case.points.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2 text-gray-300">
              <span className="text-red-400 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timestamp */}
      <div className="text-center text-xs text-gray-500">
        Analysis generated at {new Date(analysis.analyzed_at).toLocaleString()}
      </div>
    </div>
  );
}
