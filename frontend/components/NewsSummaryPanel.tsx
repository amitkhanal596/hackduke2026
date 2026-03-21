"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, RefreshCw } from "lucide-react";
import type { NewsArticle } from "@/lib/api";

interface NewsSummaryPanelProps {
  articles: NewsArticle[];
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsSummaryPanel({
  articles,
  isOpen,
  onClose,
}: NewsSummaryPanelProps) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const generateSummary = async () => {
    if (articles.length === 0) {
      setError("No articles available to summarize");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ articles }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Failed to generate summary";
        console.error("API Error:", errorMessage, "Status:", response.status);
        throw new Error(errorMessage);
      }

      if (!data.summary) {
        throw new Error("No summary returned from API");
      }

      setSummary(data.summary);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate summary. Please try again.";
      setError(errorMsg);
      console.error("Error generating summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && articles.length > 0 && !summary && !loading) {
      generateSummary();
    }
  }, [isOpen, articles]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-black border-l border-white/10 z-50 overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
        }}
      >
        {/* Header */}
        <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-purple" />
                </div>
                <h2 className="font-black text-2xl tracking-tight">
                  AI NEWS <span className="text-gradient-purple">SUMMARY</span>
                </h2>
              </div>
              <p className="text-gray-400 text-sm">
                Powered by Google Gemini AI
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin w-12 h-12 border-2 border-purple border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-400">Generating AI summary...</p>
            </div>
          ) : error ? (
            <div className="bg-chartRed/10 border border-chartRed/30 rounded-lg p-6">
              <div className="text-center mb-4">
                <p className="text-chartRed font-semibold mb-2">Error</p>
                <p className="text-gray-300 text-sm">{error}</p>
              </div>

              {error.includes("API key") && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg text-left">
                  <p className="text-xs text-gray-400 mb-2 font-semibold">
                    To fix this:
                  </p>
                  <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Get your free API key from{" "}
                      <a
                        href="https://ai.google.dev/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple hover:underline"
                      >
                        ai.google.dev
                      </a>
                    </li>
                    <li>Open <code className="bg-white/10 px-1 py-0.5 rounded">.env.local</code> file</li>
                    <li>Replace <code className="bg-white/10 px-1 py-0.5 rounded">your_gemini_api_key_here</code> with your actual API key</li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              )}

              <button
                onClick={generateSummary}
                className="mt-4 px-4 py-2 bg-purple hover:bg-purple/80 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple/20 to-purple/10 px-4 py-2 border border-purple/30 rounded-full">
                  <Sparkles className="w-4 h-4 text-purple animate-pulse" />
                  <span className="font-mono font-bold text-purple text-sm">
                    AI GENERATED INSIGHTS
                  </span>
                </div>
                <button
                  onClick={generateSummary}
                  className="text-gray-400 hover:text-purple transition-all flex items-center gap-2 text-sm hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <style jsx>{`
                  .summary-content {
                    line-height: 1.9;
                    white-space: pre-wrap;
                    color: #d1d5db;
                  }
                  .summary-content strong,
                  .summary-content b {
                    color: #a855f7;
                    font-weight: 700;
                  }
                `}</style>
                <div
                  className="summary-content"
                  dangerouslySetInnerHTML={{
                    __html: summary
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              </div>

              <div className="mt-6 p-4 bg-purple/10 border border-purple/30 rounded-lg">
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-purple">Note:</span> This
                  summary is generated by AI and should not be considered
                  financial advice. Always do your own research before making
                  investment decisions.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <Sparkles className="w-16 h-16 text-purple mb-4" />
              <p className="text-gray-400">No summary available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
