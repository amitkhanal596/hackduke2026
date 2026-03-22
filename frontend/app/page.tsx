"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import WealthVisorChat from "@/components/WealthVisorChat";
import { TrendingUp, ShieldCheck, Zap, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";

// --- LANDING PAGE COMPONENT ---
function LandingPage() {
  return (
    <div className="bg-black min-h-screen text-white flex flex-col relative overflow-x-hidden">
      <InteractiveGrid />
      
      {/* Navbar for Landing Page */}
      <header className="z-40 bg-black/50 backdrop-blur-md border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-500/50 blur-lg" />
            </div>
            <span className="font-black text-2xl tracking-tight text-emerald-400">Toro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-300 hover:text-white font-medium px-2 py-2 text-sm transition-colors hidden sm:block">
              Log In
            </Link>
            <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 pt-20 pb-32">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-8 tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Next-Gen Quant Engine Live
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-center tracking-tighter mb-6 max-w-5xl leading-tight">
          Trade Smarter. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
            Dumb It Down.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 text-center max-w-2xl mb-12 leading-relaxed">
          Toro arms retail investors with Wall Street-grade AI, deterministic quant engine signaling, and institutional sentiment tracking—without the confusing jargon. 
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/signup" className="group flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-lg px-8 py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)]">
            Join the Revolution
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all">
            Access Terminal
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24">
          <div className="bg-black/50 backdrop-blur-sm border border-emerald-500/20 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
            <Brain className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Proprietary Quant Engine</h3>
            <p className="text-gray-400 text-sm">We aggregate billions of data points across news, momentum, and Finnhub analyst recommendations.</p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/30 transition-colors">
            <Zap className="w-8 h-8 text-teal-400 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Live AI Co-Pilot</h3>
            <p className="text-gray-400 text-sm">Chat seamlessly with WealthVisor—your elite, fiduciary-grade AI assistant, entirely free of finance-bro speak.</p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-white/30 transition-colors">
            <ShieldCheck className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Institutional Safety</h3>
            <p className="text-gray-400 text-sm">Cut through the noise. Get purely objective Bull vs. Bear probabilities constructed from Wall Street sentiment.</p>
          </div>
        </div>
      </main>

      {/* Grid overlay blur blocker */}
      <div className="fixed bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent pointer-events-none z-0" />
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function DashboardApp() {
  const [trackedStocks, setTrackedStocks] = useState<string[]>([]);
  const [isAgentChatVisible, setIsAgentChatVisible] = useState(false);

  const handleAddStock = (ticker: string) => {
    if (!trackedStocks.includes(ticker.toUpperCase())) {
      setTrackedStocks([...trackedStocks, ticker.toUpperCase()]);
    }
  };

  const handleRemoveStock = (ticker: string) => {
    const newStocks = trackedStocks.filter(t => t !== ticker);
    setTrackedStocks(newStocks);
  };

  const handleChatVisibilityChange = (isVisible: boolean) => {
    setIsAgentChatVisible(isVisible);
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <InteractiveGrid />
      <DashboardLayout
        trackedStocks={trackedStocks}
        onAddStock={handleAddStock}
        onRemoveStock={handleRemoveStock}
        onChatVisibilityChange={handleChatVisibilityChange}
      />
      <WealthVisorChat hideButton={isAgentChatVisible} />
    </div>
  );
}

// --- MAIN EXPORT ---
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("toro_user");
    setIsLoggedIn(!!user);
  }, []);

  // Prevent hydration mismatch / flash by returning an empty shell briefly
  if (isLoggedIn === null) {
    return <div className="bg-black min-h-screen" />;
  }

  // If user is authenticated, route them to the main powerful layout
  if (isLoggedIn) {
    return <DashboardApp />;
  }

  // Otherwise, show the sexy new landing pitch
  return <LandingPage />;
}
