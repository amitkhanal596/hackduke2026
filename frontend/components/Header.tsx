"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, User, LogOut } from "lucide-react";
import ToroVoiceButton from "./ToroVoiceButton";
import { supabase } from "@/lib/supabase";
import { useAppLocale } from "@/lib/useAppLocale";
import { getUICopy } from "@/lib/uiCopy";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
} from "@/lib/locale";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export default function Header({ onToggleSidebar, isSidebarCollapsed }: HeaderProps) {
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const { locale, setLocale } = useAppLocale();
  const copy = getUICopy(locale);

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

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("toro_user");
    setSessionUser(null);
    window.location.href = "/";
  };

  return (
    <header
      className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 relative"
      style={{
        boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5" />

      <div className="px-4 py-4 relative">
        <div className="flex items-center justify-between">
          {/* Left Section - Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden backdrop-blur-sm"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Center Section - Toro Logo */}
          <div className="flex items-center gap-3">
            <span className=" font-mono font-black text-3xl tracking-tight bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Toro</span>
          </div>

          {/* Right Section - Voice Button + Powered by Gemini + Auth */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-4 py-1">
            <ToroVoiceButton />
            <span className="text-gray-400 text-sm font-medium hidden md:inline-block">{copy.header.poweredByGemini}</span>

            <label className="hidden lg:flex items-center gap-2 text-xs text-gray-400">
              <span>{copy.header.language}</span>
              <select
                value={locale}
                onChange={handleLocaleChange}
                className="bg-black/50 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/60"
                aria-label="Select language"
              >
                {SUPPORTED_LOCALES.map((locale) => (
                  <option key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </option>
                ))}
              </select>
            </label>

            {sessionUser ? (
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 ml-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
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
                  title={copy.header.signOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <a
                  href="/login"
                  className="text-gray-300 hover:text-white font-medium px-3 py-2 rounded-lg text-sm transition-colors bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  {copy.header.logIn}
                </a>
                <a
                  href="/signup"
                  className="bg-gradient-to-br from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-[0_4px_16px_rgba(109,212,154,0.3)]"
                >
                  {copy.header.signUp}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
