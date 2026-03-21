"use client";

import { useState, useEffect } from "react";
import NewsFeed from "./NewsFeed";
import { fetchNews } from "@/lib/api";
import type { NewsArticle } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";

interface NewsFeedForStocksProps {
  trackedStocks: string[];
  onSentimentClick?: (article: NewsArticle) => void;
}

export default function NewsFeedForStocks({ trackedStocks, onSentimentClick }: NewsFeedForStocksProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trackedStocks.length > 0) {
      loadNews();
    } else {
      setArticles([]);
    }
  }, [trackedStocks]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newsData = await fetchNews(trackedStocks);
      setArticles(newsData);
    } catch (err) {
      console.error("Error loading news:", err);
      setError("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  if (trackedStocks.length === 0) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-white mb-2">No Stocks Tracked</h3>
        <p className="text-gray-400 mb-4">
          Add some stocks to see their latest news and market updates
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green hover:bg-green/80 px-4 py-2 rounded-lg transition-colors"
        >
          Add Stocks
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-green mx-auto mb-4" />
        <p className="text-gray-400 mb-2">Loading news for {trackedStocks.length} tracked stocks...</p>
        <p className="text-sm text-green/70">Filtering for relevance using AI analysis</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-white mb-2">Error Loading News</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadNews}
          className="bg-green hover:bg-green/80 px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="font-semibold text-lg text-white mb-2">No News Found</h3>
        <p className="text-gray-400">
          No recent news articles found for your tracked stocks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* News Summary */}
      <div className="bg-green/10 border border-green/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white mb-1">Filtered News Summary</h3>
            <p className="text-sm text-gray-400">
              {articles.length} relevant articles found for {trackedStocks.join(", ")}
            </p>
            <p className="text-xs text-green/70 mt-1">
              ✓ Filtered for stock relevance using AI analysis
            </p>
          </div>
          <button
            onClick={loadNews}
            className="text-green hover:text-green/80 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* News Feed */}
      <NewsFeed articles={articles} onSentimentClick={onSentimentClick} />
    </div>
  );
}
