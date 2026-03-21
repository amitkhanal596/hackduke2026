"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { NewsArticle } from "@/lib/api";
import { format } from "date-fns";

interface ArticlePreviewPanelProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticlePreviewPanel({ article, isOpen, onClose }: ArticlePreviewPanelProps) {
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <TrendingUp className="w-4 h-4" />;
      case "negative":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && article && (
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed right-0 top-0 h-full w-full md:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col"
          style={{
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 
              className="font-bold text-lg text-white"
              style={{
                textShadow: '0 0 15px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)'
              }}
            >
              Article Preview
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
            {/* Ticker Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green/20 text-green border border-green/30 rounded-full font-mono font-bold text-sm">
                {article.ticker}
              </span>
              <span
                className={`px-3 py-1 rounded-full border flex items-center gap-1 text-sm font-medium ${getSentimentColor(
                  article.sentiment
                )}`}
              >
                {getSentimentIcon(article.sentiment)}
                {article.sentiment}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white leading-tight">
              {article.title}
            </h2>

            {/* Date */}
            <p className="text-sm text-gray-400 font-mono">
              {format(new Date(article.published_at), "MMM dd, yyyy 'at' h:mm a")}
            </p>

            {/* Summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Summary</h4>
              <p className="text-gray-300 leading-relaxed">{article.summary}</p>
            </div>

            {/* Open Article Button */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-purple hover:bg-purple/80 text-white px-4 py-3 rounded-lg transition-colors font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              Read Full Article
            </a>

            {/* AI Analysis Section */}
            <div className="bg-gradient-to-br from-purple/10 to-green/10 border border-purple/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple rounded-full animate-pulse" />
                <h4 className="text-sm font-semibold text-purple">AI Sentiment Analysis</h4>
              </div>
              <p className="text-sm text-gray-300">
                Check the AI Chat panel below for a detailed explanation of why this article
                was rated as <span className="font-bold text-white">{article.sentiment}</span>.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
