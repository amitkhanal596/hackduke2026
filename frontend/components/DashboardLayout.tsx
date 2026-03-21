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
import { stockList } from "@/lib/stockList";
import type { NewsArticle } from "@/lib/api";
import { X } from "lucide-react";

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
                ADD <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  STOCKS
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Search and add stocks to your tracking portfolio
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
                NEWS <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  FEED
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Latest market news and analysis for your tracked stocks
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
                AI <span
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  CHAT
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Chat with WealthVisor AI for market insights
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
                VOICE <span 
                  className="text-gradient-green"
                  style={{
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.2), 0 0 20px rgba(16, 185, 129, 0.1)'
                  }}
                >
                  NEWS
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Listen to AI-generated market commentary
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

      <div className="flex h-screen bg-black text-white">
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
                <h3 className="font-bold text-lg text-white">AI Sentiment Analysis</h3>
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
                  placeholder="Ask about this article..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
