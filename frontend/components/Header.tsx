"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [sessionUser, setSessionUser] = useState<string | null>(null);

  useEffect(() => {
    // Check for Supabase session
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Trader";
        setSessionUser(displayName);
      }
    }

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || "Trader";
        setSessionUser(displayName);
      } else {
        setSessionUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("toro_user");
    setSessionUser(null);
    window.location.href = "/";
  };

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

          {/* Right Section - Powered by Gemini and Auth State */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-4 py-1">
            <span className="text-gray-400 text-sm font-medium hidden md:inline-block">Powered by Gemini</span>
            
            {sessionUser ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 ml-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 text-emerald-400 p-1 rounded-full">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-white text-sm font-semibold tracking-wide truncate max-w-[120px] capitalize">
                    {sessionUser}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-emerald-400 transition-colors ml-1 border-l border-white/10 pl-3"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <a 
                  href="/login" 
                  className="text-gray-300 hover:text-white font-medium px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Log In
                </a>
                <a 
                  href="/signup" 
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Sign Up
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}