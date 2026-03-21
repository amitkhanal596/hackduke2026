"use client";

import { Plus, TrendingUp, Sparkles, Activity, Volume2 } from "lucide-react";
import VoiceNewsButton from "./VoiceNewsButton";

interface QuickActionsProps {
  onAddStock: () => void;
  onAISummary: () => void;
  isLoading: boolean;
  hasNews: boolean;
}

export default function QuickActions({ 
  onAddStock, 
  onAISummary, 
  isLoading, 
  hasNews 
}: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Add Stock Button */}
      <button
        onClick={onAddStock}
        className="flex items-center gap-2 bg-purple hover:bg-purple/80 px-4 py-2 rounded-full transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="font-mono font-bold text-sm">ADD STOCK</span>
      </button>

      {/* AI Summary Button */}
      <button
        onClick={onAISummary}
        disabled={!hasNews}
        className="flex items-center gap-2 bg-purple/20 hover:bg-purple/30 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded-full transition-colors border border-purple/30"
      >
        <Sparkles className="w-4 h-4" />
        <span className="font-mono font-bold text-sm">AI SUMMARY</span>
      </button>

      {/* Voice News Button */}
      <VoiceNewsButton />

      {/* Live Status */}
      <div className="flex items-center gap-2 bg-purple/10 px-4 py-2 border border-purple/30 rounded-full">
        <Activity className="w-4 h-4 text-purple animate-pulse" />
        <span className="font-mono font-bold text-purple text-sm">
          {isLoading ? "LOADING" : "LIVE"}
        </span>
      </div>
    </div>
  );
}
