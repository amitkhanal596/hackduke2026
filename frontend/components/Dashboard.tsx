"use client";

import { useEffect, useState } from "react";
import StockCard from "./StockCard";
import NewsFeed from "./NewsFeed";
import NewsSummaryPanel from "./NewsSummaryPanel";
import { InteractiveGrid } from "./InteractiveGrid";
import { fetchNews, getPastEvents, getUpcomingEvents } from "@/lib/api";
import type { NewsArticle, EventAnalysis, UpcomingEvent } from "@/lib/api";
import { Activity, TrendingUp, Sparkles } from "lucide-react";

interface DashboardProps {
  trackedStocks: string[];
  onRemoveStock: (ticker: string) => void;
  onAddStockClick: () => void;
}

export default function Dashboard({ trackedStocks, onRemoveStock, onAddStockClick }: DashboardProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [pastEvents, setPastEvents] = useState<Record<string, EventAnalysis[]>>({});
  const [upcomingEvents, setUpcomingEvents] = useState<Record<string, UpcomingEvent[]>>({});
  const [loading, setLoading] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);

  useEffect(() => {
    if (trackedStocks.length > 0) {
      loadData();
    }
  }, [trackedStocks]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch news for all tracked stocks
      const newsData = await fetchNews(trackedStocks);
      setNews(newsData);

      // Fetch events for each stock
      const pastEventsPromises = trackedStocks.map(ticker =>
        getPastEvents(ticker).catch(() => [])
      );
      const upcomingEventsPromises = trackedStocks.map(ticker =>
        getUpcomingEvents(ticker).catch(() => [])
      );

      const pastEventsResults = await Promise.all(pastEventsPromises);
      const upcomingEventsResults = await Promise.all(upcomingEventsPromises);

      const pastEventsMap: Record<string, EventAnalysis[]> = {};
      const upcomingEventsMap: Record<string, UpcomingEvent[]> = {};

      trackedStocks.forEach((ticker, index) => {
        pastEventsMap[ticker] = pastEventsResults[index];
        upcomingEventsMap[ticker] = upcomingEventsResults[index];
      });

      setPastEvents(pastEventsMap);
      setUpcomingEvents(upcomingEventsMap);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (trackedStocks.length === 0) {
    return (
        <div className="text-center py-12">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <TrendingUp className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-black text-3xl text-white mb-3 tracking-tight">
              START <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">TRACKING</span>
            </h2>
            <p className="text-gray-400 mb-6 text-lg">
              Add stocks to start tracking events and news
            </p>
            <button
              onClick={onAddStockClick}
              className="flex items-center gap-2 bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400 hover:from-emerald-300 hover:via-green-300 hover:to-teal-300 text-black px-6 py-3 rounded-xl transition-all mx-auto font-bold shadow-[0_8px_24px_rgba(109,212,154,0.4)] hover:shadow-[0_12px_36px_rgba(109,212,154,0.6)]"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-mono font-bold text-lg">ADD YOUR FIRST STOCK</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Quick Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowSummaryPanel(true)}
              disabled={news.length === 0}
              className="flex items-center gap-2 bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400 hover:from-emerald-300 hover:via-green-300 hover:to-teal-300 disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-black px-4 py-2 rounded-xl transition-all shadow-[0_4px_16px_rgba(109,212,154,0.3)] hover:shadow-[0_8px_24px_rgba(109,212,154,0.5)] disabled:shadow-none"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-mono font-bold text-base">
                AI SUMMARY
              </span>
            </button>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 border border-emerald-400/30 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-emerald-400 text-base">
                {loading ? "LOADING" : "LIVE"}
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-50" />
            <div className="text-center relative z-10">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading data...</p>
            </div>
          </div>
        )}

        {/* Tracked Stocks */}
        <div className="mb-6">
          <h2 className="mb-4 font-black text-3xl tracking-tight">
            TRACKED <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">STOCKS</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackedStocks.map((ticker, index) => (
              <div
                key={ticker}
                className={`card-animate ${
                  index === 0 ? 'card-animate-delay-100' :
                  index === 1 ? 'card-animate-delay-200' :
                  index === 2 ? 'card-animate-delay-300' :
                  index === 3 ? 'card-animate-delay-400' :
                  index === 4 ? 'card-animate-delay-500' :
                  'card-animate-delay-100'
                }`}
              >
                <StockCard
                  ticker={ticker}
                  pastEvents={pastEvents[ticker] || []}
                  upcomingEvents={upcomingEvents[ticker] || []}
                  onRemove={() => onRemoveStock(ticker)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* News Feed */}
        <NewsFeed articles={news} />

        {/* AI Summary Panel */}
        <NewsSummaryPanel
          articles={news}
          isOpen={showSummaryPanel}
          onClose={() => setShowSummaryPanel(false)}
        />
      </div>
    );
  }
