"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { EventAnalysis, UpcomingEvent } from "@/lib/api";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, X, Calendar } from "lucide-react";
import PriceDisplay from "./PriceDisplay";
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
      <div 
        className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-6 hover:border-purple/50 transition-all"
        style={{
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <button
            onClick={() => setShowPriceModal(true)}
            className="font-mono font-black text-2xl text-white tracking-tight hover:text-purple transition-colors cursor-pointer"
          >
            {ticker}
          </button>
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-purple transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowPast(true)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              showPast
                ? "bg-purple text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            Past Events
          </button>
          <button
            onClick={() => setShowPast(false)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              !showPast
                ? "bg-purple text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
          {showPast ? (
            pastEvents.length > 0 ? (
              pastEvents.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className={`border-l-4 border-purple pl-3 py-2 bg-white/5 rounded hover:bg-white/10 transition-colors card-animate ${
                    index === 0 ? 'card-animate-delay-100' :
                    index === 1 ? 'card-animate-delay-200' :
                    index === 2 ? 'card-animate-delay-300' :
                    index === 3 ? 'card-animate-delay-400' :
                    'card-animate-delay-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{event.event}</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {format(new Date(event.date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {event.car_0_1 > 0 ? (
                        <TrendingUp className="w-4 h-4 text-chartGreen" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-chartRed" />
                      )}
                      <span
                        className={`text-lg font-bold font-mono ${getCarColor(event.car_0_1)}`}
                      >
                        {event.car_0_1 > 0 ? "+" : ""}
                        {event.car_0_1.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getSentimentColor(
                        event.sentiment
                      )}`}
                    >
                      {event.sentiment}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      Vol: {event.volatility_change.toFixed(2)}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{event.conclusion}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No past events available</p>
            )
          ) : upcomingEvents.length > 0 ? (
            upcomingEvents.map((event, index) => (
              <div
                key={index}
                className={`border-l-4 border-purple pl-3 py-2 bg-white/5 rounded hover:bg-white/10 transition-colors card-animate ${
                  index === 0 ? 'card-animate-delay-100' :
                  index === 1 ? 'card-animate-delay-200' :
                  index === 2 ? 'card-animate-delay-300' :
                  index === 3 ? 'card-animate-delay-400' :
                  'card-animate-delay-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{event.type}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {format(new Date(event.date), "MMM dd, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-purple/10 text-purple border border-purple/30 rounded">
                      {event.expected_impact}
                    </span>
                    <button
                      onClick={() => addToGoogleCalendar({
                        title: event.type,
                        description: `${ticker} - ${event.type} (Expected Impact: ${event.expected_impact})`,
                        date: event.date,
                        ticker: ticker
                      })}
                      className="p-1.5 bg-purple/20 hover:bg-purple/30 text-purple rounded transition-colors"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No upcoming events</p>
          )}
        </div>
      </div>

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
