"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import WealthVisorChat from "@/components/WealthVisorChat";
import { TrendingUp, ShieldCheck, Zap, Brain, ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// --- LANDING PAGE COMPONENT ---
function LandingPage() {
  return (
    <div className="bg-black min-h-screen text-[#6dd49a] flex flex-col relative overflow-hidden font-mono">
      {/* Liquid Glass Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top Left Orb - Cyan to Green */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/30 via-emerald-400/25 to-green-500/20 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

        {/* Top Right Orb - Purple to Green */}
        <div className="absolute -top-32 right-20 w-[500px] h-[500px] bg-gradient-to-bl from-purple-400/20 via-emerald-300/15 to-cyan-400/25 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />

        {/* Bottom Center Orb - Green to Teal */}
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-t from-teal-400/25 via-green-400/20 to-emerald-500/15 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />

        {/* Floating orb - Emerald */}
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-300/20 to-green-400/10 rounded-full blur-2xl animate-[pulse_7s_ease-in-out_infinite]" />
      </div>

      {/* Noise Texture for grain */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-[0.015] mix-blend-overlay">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')]" />
      </div>

      <InteractiveGrid />

      {/* Glass Header */}
      <header className="z-40 border-b border-white/10 bg-black/20 backdrop-blur-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5" />
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 relative">
          {/* Terminal Top Bar */}
          <div className="flex items-center gap-2 text-[#6dd49a]/50 text-xs mb-2">
            <span>█</span>
            <span className="animate-pulse">_</span>
            <span className="ml-auto">SYSTEM: ONLINE</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="text-[#6dd49a] text-2xl font-bold tracking-wider flex items-center gap-2">
                  <span className="text-[#4db87e]">&gt;</span>
                  <span>TORO</span>
                  <span className="animate-pulse text-sm">█</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[#6dd49a]/70 hover:text-[#6dd49a] font-medium px-3 py-2 text-sm transition-colors border border-white/10 hover:border-[#6dd49a]/40 backdrop-blur-sm bg-white/5 rounded-lg hidden sm:block">
                [LOGIN]
              </Link>
              <Link href="/signup" className="bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-black font-bold px-5 py-2.5 text-sm transition-all shadow-[0_0_30px_rgba(109,212,154,0.3)] hover:shadow-[0_0_40px_rgba(109,212,154,0.5)] rounded-lg">
                &gt; GET STARTED
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Terminal Content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-10 px-4 pt-12 pb-20">

        {/* System Status Badge - Glass */}
        <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/20 bg-white/5 backdrop-blur-xl text-[#6dd49a] text-xs font-medium mb-12 tracking-wider uppercase rounded-full shadow-[0_8px_32px_rgba(109,212,154,0.15)]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-br from-emerald-400 to-green-400"></span>
          </span>
          <span>REAL-TIME ANALYTICS ACTIVE</span>
          <span className="text-[#4db87e]">█</span>
        </div>

        {/* ASCII Art Title */}
        <div className="mb-8 text-center">
          <pre className="text-[#6dd49a]/65 text-xs md:text-sm leading-tight mb-4">
{`╔════════════════════════════════════════════╗
║   MARKET INTELLIGENCE TERMINAL  v2.026    ║
╚════════════════════════════════════════════╝`}
          </pre>
        </div>

        <h1 className="text-4xl md:text-7xl font-bold text-center tracking-tight mb-4 max-w-5xl leading-tight">
          <span className="text-[#6dd49a]">Smart Trading,</span>
          <br/>
          <span className="text-[#4db87e]">Made Simple</span>
          <span className="animate-pulse">_</span>
        </h1>

        <p className="text-sm md:text-base text-[#6dd49a]/75 text-center max-w-2xl mb-12 leading-relaxed font-mono px-6 border-l border-[#6dd49a]/25 bg-black/30 py-4">
          <span className="text-[#4db87e]">//</span> Professional-grade market analytics designed for everyday investors.
          <br/>
          <span className="text-[#4db87e]">//</span> Real-time insights, AI-powered analysis, no complexity.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-16">
          <Link href="/signup" className="group flex items-center justify-center gap-3 bg-gradient-to-br from-emerald-400 via-green-400 to-teal-400 hover:from-emerald-300 hover:via-green-300 hover:to-teal-300 text-black font-bold text-base px-8 py-4 transition-all shadow-[0_8px_32px_rgba(109,212,154,0.4)] hover:shadow-[0_12px_48px_rgba(109,212,154,0.6)] rounded-xl">
            <span>&gt;&gt; Start Trading</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/20 hover:border-emerald-400/50 text-[#6dd49a] font-bold text-base px-8 py-4 transition-all shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(109,212,154,0.2)] rounded-xl">
            <span>&gt; Sign In</span>
          </Link>
        </div>

        {/* Glass Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          <div className="relative border border-white/10 bg-white/5 backdrop-blur-2xl p-6 hover:bg-white/10 hover:border-emerald-400/30 transition-all group rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-[#6dd49a]/55 text-xs">
                <span>█</span>
                <span>ANALYTICS</span>
                <span className="ml-auto group-hover:text-[#6dd49a] transition-colors">█</span>
              </div>
              <Brain className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-[#6dd49a] font-bold text-lg mb-3 tracking-wide">&gt; Smart Data Engine</h3>
              <p className="text-[#6dd49a]/70 text-sm leading-relaxed font-mono">
                Powerful analytics that synthesize news sentiment, price trends, and market consensus into clear, actionable insights.
              </p>
            </div>
          </div>

          <div className="relative border border-white/10 bg-white/5 backdrop-blur-2xl p-6 hover:bg-white/10 hover:border-green-400/30 transition-all group rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-[#6dd49a]/55 text-xs">
                <span>█</span>
                <span>AI ASSISTANT</span>
                <span className="ml-auto group-hover:text-[#6dd49a] transition-colors">█</span>
              </div>
              <Zap className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-[#6dd49a] font-bold text-lg mb-3 tracking-wide">&gt; WealthVisor AI</h3>
              <p className="text-[#6dd49a]/70 text-sm leading-relaxed font-mono">
                Your personal AI advisor that explains complex market data in plain English, helping you make informed investment decisions.
              </p>
            </div>
          </div>

          <div className="relative border border-white/10 bg-white/5 backdrop-blur-2xl p-6 hover:bg-white/10 hover:border-teal-400/30 transition-all group rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-[#6dd49a]/55 text-xs">
                <span>█</span>
                <span>PROBABILITIES</span>
                <span className="ml-auto group-hover:text-[#6dd49a] transition-colors">█</span>
              </div>
              <ShieldCheck className="w-10 h-10 text-teal-400 mb-4" />
              <h3 className="text-[#6dd49a] font-bold text-lg mb-3 tracking-wide">&gt; Market Confidence</h3>
              <p className="text-[#6dd49a]/70 text-sm leading-relaxed font-mono">
                Clear bull/bear probability scores and sentiment analysis to help you understand market direction and manage risk effectively.
              </p>
            </div>
          </div>
        </div>

        {/* Terminal Footer Prompt */}
        <div className="mt-16 text-center text-[#6dd49a]/45 text-xs font-mono">
          <p>$ system_status: operational | market_feed: live | latency: &lt;10ms</p>
          <p className="mt-1 animate-pulse">█ ready_</p>
        </div>
      </main>

      {/* Bottom Gradient Fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-0" />
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
function DashboardApp() {
  const [trackedStocks, setTrackedStocks] = useState<string[]>([]);
  const [isAgentChatVisible, setIsAgentChatVisible] = useState(false);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);

  // Load user's stocks when component mounts
  useEffect(() => {
    async function loadUserStocks() {
      try {
        const { getUserStocks } = await import('@/lib/api');
        const stocks = await getUserStocks();
        setTrackedStocks(stocks);
      } catch (error) {
        console.error('Failed to load user stocks:', error);
        // If user is not authenticated or error occurs, tracked stocks will be empty
      } finally {
        setIsLoadingStocks(false);
      }
    }

    loadUserStocks();
  }, []);

  const handleAddStock = async (ticker: string) => {
    if (!trackedStocks.includes(ticker.toUpperCase())) {
      try {
        const { addTicker } = await import('@/lib/api');
        await addTicker(ticker);
        setTrackedStocks([...trackedStocks, ticker.toUpperCase()]);
      } catch (error) {
        console.error('Failed to add stock:', error);
        alert('Failed to add stock. Please try again.');
      }
    }
  };

  const handleRemoveStock = async (ticker: string) => {
    try {
      const { removeTicker } = await import('@/lib/api');
      await removeTicker(ticker);
      const newStocks = trackedStocks.filter(t => t !== ticker);
      setTrackedStocks(newStocks);
    } catch (error) {
      console.error('Failed to remove stock:', error);
      alert('Failed to remove stock. Please try again.');
    }
  };

  const handleChatVisibilityChange = (isVisible: boolean) => {
    setIsAgentChatVisible(isVisible);
  };

  if (isLoadingStocks) {
    return (
      <div className="bg-black min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

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
    // Check for Supabase session
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // Also keep localStorage in sync for backward compatibility
      if (session) {
        const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Trader";
        localStorage.setItem("toro_user", displayName);
      } else {
        localStorage.removeItem("toro_user");
      }
    }

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);

      if (session) {
        const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Trader";
        localStorage.setItem("toro_user", displayName);
      } else {
        localStorage.removeItem("toro_user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
