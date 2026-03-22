"use client";

import { Search, TrendingUp } from "lucide-react";
import ToroVoiceButton from "./ToroVoiceButton";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  return (
    <header 
      className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10"
      style={{
        boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
      }}
    >
      <div className="absolute inset-x-0 bg-gradient-to-r from-transparent via-purple to-transparent h-px" />
      
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center Section - Toro Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <TrendingUp className="w-7 h-7 text-green" />
              <div className="absolute inset-0 bg-green/50 blur-lg" />
            </div>
            <span className="font-black text-2xl tracking-tight text-green">Toro</span>
          </div>

          {/* Right Section - Voice Button + Powered by Gemini */}
          <div className="flex items-center gap-3">
            <ToroVoiceButton />
            <span className="text-gray-400 text-sm font-medium hidden sm:block">Powered by Gemini 2.5</span>
          </div>
        </div>
      </div>
    </header>
  );
}