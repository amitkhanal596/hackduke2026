"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./Dashboard";
import AddStockForm from "./AddStockForm";
import NewsFeedForStocks from "./NewsFeedForStocks";
import AgentChat from "./AgentChat";
import VoiceNewsButton from "./VoiceNewsButton";
import Onboarding from "./Onboarding";
import StockPillsContainer from "./StockPillsContainer";
import OptimizedDotBackground from "./OptimizedDotBackground";
import ShootingStarsOverlay from "./ShootingStarsOverlay";
import { stockList } from "@/lib/stockList";
import type { NewsArticle } from "@/lib/api";
import { X } from "lucide-react";
import { useAppLocale } from "@/lib/useAppLocale";
import { getUICopy } from "@/lib/uiCopy";

interface DashboardLayoutProps {
  trackedStocks: string[];
  onAddStock: (ticker: string) => void;
  onRemoveStock: (ticker: string) => void;
  onChatVisibilityChange?: (isVisible: boolean) => void;
}

export default function DashboardLayout({
  trackedStocks,
  onAddStock,
  onRemoveStock,
  onChatVisibilityChange
}: DashboardLayoutProps) {
  const { locale } = useAppLocale();
  const copy = getUICopy(locale);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string>("");

  // Effect to handle WealthVisor chat button visibility when switching sections
  useEffect(() => {
    // Hide the WealthVisor button when on the chat page
    onChatVisibilityChange?.(activeSection === "chat");
  }, [activeSection, onChatVisibilityChange]);

  // Show onboarding for new users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShowOnboarding(false);
  };

  const handleAddStockClick = () => {
    setActiveSection("add-stocks");
  };

  const handleViewStockDetails = (ticker: string) => {
    // Navigate to stock details or show modal
    console.log(`Viewing details for ${ticker}`);
  };

  const handleSentimentClick = async (article: NewsArticle) => {
    // Simplified sentiment explanation prompt
    const prompt = `Explain why this article about ${article.ticker} is ${article.sentiment}:\n\n"${article.title}"\n\n${article.summary}`;

    // Set the initial message for the chat
    setChatInitialMessage(prompt);

    // Show the chat overlay
    setShowChat(true);
    onChatVisibilityChange?.(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setChatInitialMessage("");
    onChatVisibilityChange?.(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <Dashboard
            trackedStocks={trackedStocks}
            onRemoveStock={onRemoveStock}
            onAddStockClick={handleAddStockClick}
          />
        );
      case "add-stocks":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 
                className="mb-3 font-black text-5xl tracking-tight"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08)'
                }}
              >
                <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  {copy.dashboardLayout.addStocksTitle}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                {copy.dashboardLayout.addStocksDesc}
              </p>
            </div>
            <AddStockForm onAddStock={onAddStock} stockList={stockList} />
          </div>
        );
      case "news":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 
                className="mb-3 font-black text-5xl tracking-tight"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08)'
                }}
              >
                <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  {copy.dashboardLayout.newsFeedTitle}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                {copy.dashboardLayout.newsFeedDesc}
              </p>
            </div>
            <NewsFeedForStocks
              trackedStocks={trackedStocks}
              onSentimentClick={handleSentimentClick}
            />
          </div>
        );
      case "chat":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1
                className="mb-3 font-black text-5xl tracking-tight"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08)'
                }}
              >
                <span
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  {copy.dashboardLayout.aiChatTitle}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                {copy.dashboardLayout.aiChatDesc}
              </p>
            </div>
            <AgentChat />
          </div>
        );
      case "voice-news":
        return (
          <div className="space-y-6">
            <div className="mb-8">
              <h1 
                className="mb-3 font-black text-5xl tracking-tight"
                style={{
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08)'
                }}
              >
                <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  {copy.dashboardLayout.voiceNewsTitle}
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                {copy.dashboardLayout.voiceNewsDesc}
              </p>
            </div>
            <div className="flex justify-center">
              <VoiceNewsButton />
            </div>
          </div>
        );
      default:
        return (
          <Dashboard
            trackedStocks={trackedStocks}
            onRemoveStock={onRemoveStock}
            onAddStockClick={handleAddStockClick}
          />
        );
    }
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <Onboarding onComplete={handleCompleteOnboarding} />
      )}

      <div className="flex h-screen bg-black text-white relative overflow-hidden">
        {/* Optimized Dot Grid Background */}
        <OptimizedDotBackground />

        {/* Shooting Stars Overlay */}
        <ShootingStarsOverlay />

        {/* Liquid Glass Gradient Orbs Background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Top Left Orb - Cyan to Green */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-cyan-400/15 via-emerald-400/10 to-green-500/8 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

          {/* Top Right Orb - Purple to Green */}
          <div className="absolute -top-32 right-20 w-[500px] h-[500px] bg-gradient-to-bl from-purple-400/12 via-emerald-300/8 to-cyan-400/15 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />

          {/* Bottom Center Orb - Green to Teal */}
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] bg-gradient-to-t from-teal-400/15 via-green-400/10 to-emerald-500/8 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />

          {/* Floating orb - Emerald */}
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-300/12 to-green-400/6 rounded-full blur-2xl animate-[pulse_7s_ease-in-out_infinite]" />
        </div>

        {/* Sidebar */}
        <div className="relative z-20">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-20">
          {/* Header */}
          <Header
            onToggleSidebar={handleToggleSidebar}
            isSidebarCollapsed={isSidebarCollapsed}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4 lg:p-6">
              {/* Stock Pills - Always visible at top */}
              <div className="mb-6">
                <StockPillsContainer
                  trackedStocks={trackedStocks}
                  onRemoveStock={onRemoveStock}
                  onAddStock={handleAddStockClick}
                  onViewStockDetails={handleViewStockDetails}
                />
              </div>

              {renderContent()}
            </div>
          </main>
        </div>

        {/* Full-Height AI Chat Overlay - Hidden when on chat section */}
        {showChat && activeSection !== "chat" && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={handleCloseChat}>
            <div
              className="fixed right-0 top-0 h-screen w-full md:w-[500px] lg:w-[600px] bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple/20 to-green/20">
                <h3 className="font-bold text-lg text-white">{copy.dashboardLayout.sentimentAnalysis}</h3>
                <button
                  onClick={handleCloseChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Content - Full Height */}
              <div className="flex-1 overflow-hidden">
                <AgentChat
                  initialMessage={chatInitialMessage}
                  autoSend={true}
                  placeholder={copy.dashboardLayout.askArticle}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
