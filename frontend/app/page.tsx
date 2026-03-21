"use client";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import WealthVisorChat from "@/components/WealthVisorChat";

export default function Home() {
  const [trackedStocks, setTrackedStocks] = useState<string[]>([]);
  const [isAgentChatVisible, setIsAgentChatVisible] = useState(false);

  const handleAddStock = (ticker: string) => {
    if (!trackedStocks.includes(ticker.toUpperCase())) {
      setTrackedStocks([...trackedStocks, ticker.toUpperCase()]);
    }
  };

  const handleRemoveStock = (ticker: string) => {
    console.log('Page: handleRemoveStock called with ticker:', ticker);
    console.log('Page: Current trackedStocks before removal:', trackedStocks);
    const newStocks = trackedStocks.filter(t => t !== ticker);
    console.log('Page: New trackedStocks after removal:', newStocks);
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

      {/* WealthVisor AI Chatbot - Fades out when AgentChat is visible */}
      <WealthVisorChat hideButton={isAgentChatVisible} />
    </div>
  );
}
