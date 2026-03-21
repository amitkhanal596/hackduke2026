"use client";

import type { NewsArticle } from "@/lib/api";
import { format } from "date-fns";
import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

interface NewsFeedProps {
  articles: NewsArticle[];
  onSentimentClick?: (article: NewsArticle) => void;
}

export default function NewsFeed({ articles, onSentimentClick }: NewsFeedProps) {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "bg-chartGreen/10 text-chartGreen border-chartGreen/20";
      case "negative":
        return "bg-chartRed/10 text-chartRed border-chartRed/20";
      default:
        return "bg-gray-800 text-gray-400 border-gray-600";
    }
  };

  if (articles.length === 0) {
    return null;
  }

  return (
    <div 
      className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-6"
      style={{
        boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
      }}
    >
      <h2 
        className="font-black text-3xl text-white mb-6 tracking-tight"
        style={{
          textShadow: '0 0 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(255, 255, 255, 0.08)'
        }}
      >
      </h2>
      <div className="space-y-4">
        {articles.map((article, index) => (
          <div
            key={index}
            className="border-l-4 border-green pl-4 py-3 hover:bg-white/5 transition-colors rounded"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-white hover:text-green transition-colors group flex items-start gap-2"
                >
                  {article.title}
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green transition-colors" />
                </a>
                <p className="text-base text-gray-400 mt-2">{article.summary}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm font-bold text-green font-mono">
                    {article.ticker}
                  </span>
                  <button
                    onClick={() => onSentimentClick?.(article)}
                    className={`text-sm px-3 py-1 rounded border ${getSentimentColor(
                      article.sentiment
                    )} hover:opacity-80 transition-opacity cursor-pointer font-semibold`}
                    title="Click to see AI sentiment analysis"
                  >
                    {article.sentiment}
                  </button>
                  <span className="text-sm text-gray-500 font-mono">
                    {format(new Date(article.published_at), "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
