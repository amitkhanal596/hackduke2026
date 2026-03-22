"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { EventAnalysis, UpcomingEvent } from "@/lib/api";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, X, Calendar, Activity } from "lucide-react";
import PriceDisplay from "./PriceDisplay";
import BullBearAnalysisPanel from "./BullBearAnalysisPanel";
import { addToGoogleCalendar } from "@/lib/calendar";

interface StockCardProps {
  ticker: string;
  pastEvents: EventAnalysis[];
  upcomingEvents: UpcomingEvent[];
  onRemove: () => void;
}

export default function StockCard({
  ticker,
  pastEvents,
  upcomingEvents,
  onRemove,
}: StockCardProps) {
  const [showPast, setShowPast] = useState(true);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-chartGreen bg-chartGreen/10 border-chartGreen/20";
      case "negative":
        return "text-chartRed bg-chartRed/10 border-chartRed/20";
      default:
        return "text-gray-400 bg-gray-800 border-gray-600";
    }
  };

  const getCarColor = (car: number) => {
    if (car > 1) return "text-chartGreen";
    if (car < -1) return "text-chartRed";
    return "text-gray-400";
  };

  return (
    <>
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-400/30 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPriceModal(true)}
                className="font-mono font-black text-2xl bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent tracking-tight hover:from-emerald-300 hover:to-green-300 transition-all cursor-pointer"
              >
                {ticker}
              </button>
              <button
                onClick={() => setShowAnalysis(true)}
                className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="View Bull vs Bear Analysis"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-emerald-400 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShowPast(true)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                showPast
                  ? "bg-gradient-to-r from-emerald-400 to-green-400 text-black shadow-[0_4px_12px_rgba(109,212,154,0.3)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white backdrop-blur-sm"
              }`}
            >
              Past Events
            </button>
            <button
              onClick={() => setShowPast(false)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                !showPast
                  ? "bg-gradient-to-r from-emerald-400 to-green-400 text-black shadow-[0_4px_12px_rgba(109,212,154,0.3)]"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white backdrop-blur-sm"
              }`}
            >
              Upcoming
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
          {showPast ? (
            pastEvents.length > 0 ? (
              pastEvents.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className={`border border-emerald-500/20 bg-black/40 backdrop-blur-sm rounded-lg p-3 hover:bg-black/60 hover:border-emerald-500/40 transition-all group relative overflow-hidden card-animate ${
                    index === 0 ? 'card-animate-delay-100' :
                    index === 1 ? 'card-animate-delay-200' :
                    index === 2 ? 'card-animate-delay-300' :
                    index === 3 ? 'card-animate-delay-400' :
                    'card-animate-delay-500'
                  }`}
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{event.event}</p>
                        <p className="text-xs text-emerald-400/60 font-mono mt-0.5">
                          {format(new Date(event.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {event.car_0_1 > 0 ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span
                          className={`text-base font-black font-mono tabular-nums ${getCarColor(event.car_0_1)}`}
                        >
                          {event.car_0_1 > 0 ? "+" : ""}
                          {event.car_0_1.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono border ${getSentimentColor(
                          event.sentiment
                        )}`}
                      >
                        {event.sentiment}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        Vol: {event.volatility_change.toFixed(2)}x
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">{event.conclusion}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-emerald-500/50 text-sm font-mono">[NO_PAST_EVENTS]</p>
              </div>
            )
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <div
                key={index}
                className={`border border-emerald-500/20 bg-black/40 backdrop-blur-sm rounded-lg p-3 hover:bg-black/60 hover:border-emerald-500/40 transition-all group relative overflow-hidden card-animate ${
                  index === 0 ? 'card-animate-delay-100' :
                  index === 1 ? 'card-animate-delay-200' :
                  index === 2 ? 'card-animate-delay-300' :
                  index === 3 ? 'card-animate-delay-400' :
                  'card-animate-delay-500'
                }`}
              >
                {/* Subtle glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10 flex justify-between items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{event.type}</p>
                    <p className="text-xs text-emerald-400/60 font-mono mt-0.5">
                      {format(new Date(event.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-1 bg-purple/20 text-purple border border-purple/40 rounded font-mono font-semibold">
                      {event.expected_impact}
                    </span>
                    <button
                      onClick={() => addToGoogleCalendar({
                        title: event.type,
                        description: `${ticker} - ${event.type} (Expected Impact: ${event.expected_impact})`,
                        date: event.date,
                        ticker: ticker
                      })}
                      className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded transition-all hover:border-emerald-500/60"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-emerald-500/50 text-sm font-mono">[NO_UPCOMING_EVENTS]</p>
            </div>
          )}
        </div>
      </div>

      {showAnalysis && createPortal(
        <BullBearAnalysisPanel
          ticker={ticker}
          isOpen={showAnalysis}
          onClose={() => setShowAnalysis(false)}
        />,
        document.body
      )}
      {/* Price Modal */}
      {showPriceModal && typeof document !== 'undefined' && createPortal(
        <PriceDisplay
          ticker={ticker}
          onClose={() => setShowPriceModal(false)}
        />,
        document.body
      )}
    </>
  );
}
