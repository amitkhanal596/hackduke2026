"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";

interface AddStockFormProps {
  onAddStock: (ticker: string) => void;
  stockList?: Array<{ symbol: string; name: string }>;
}

export default function AddStockForm({ onAddStock, stockList = [] }: AddStockFormProps) {
  const [ticker, setTicker] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredStocks, setFilteredStocks] = useState<Array<{ symbol: string; name: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter stocks based on input
  useEffect(() => {
    if (ticker.trim().length > 0) {
      const query = ticker.toLowerCase();
      const filtered = stockList.filter(
        (stock) =>
          stock &&
          stock.symbol &&
          stock.name &&
          (stock.symbol.toLowerCase().includes(query) ||
            stock.name.toLowerCase().includes(query))
      );
      setFilteredStocks(filtered.slice(0, 10)); // Limit to 10 results
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setShowDropdown(false);
      setFilteredStocks([]);
    }
  }, [ticker, stockList]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onAddStock(ticker.trim().toUpperCase());
      setTicker("");
      setShowDropdown(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    setTicker(symbol);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredStocks.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredStocks.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredStocks.length) {
          handleSelectStock(filteredStocks[selectedIndex].symbol);
        } else {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div 
      className="z-10 relative bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-6 mb-6"
      style={{
        boxShadow: '0 0 25px rgba(16, 185, 129, 0.06), inset 0 0 15px rgba(16, 185, 129, 0.02)'
      }}
    >
      <h2 
        className="font-black text-xl text-white mb-4 tracking-tight"
        style={{
          textShadow: '0 0 6px rgba(255, 255, 255, 0.15), 0 0 12px rgba(255, 255, 255, 0.08)'
        }}
      >
        ADD <span 
          className="text-gradient-purple"
          style={{
            textShadow: '0 0 6px rgba(139, 92, 246, 0.2), 0 0 12px rgba(139, 92, 246, 0.1)'
          }}
        >
          STOCK
        </span>
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter stock ticker or company name (e.g., AAPL, Apple)"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple/50 text-white placeholder:text-gray-500 font-mono"
            autoComplete="off"
          />

          {/* Autocomplete Dropdown */}
          {showDropdown && filteredStocks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50">
              {filteredStocks.map((stock, index) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => handleSelectStock(stock.symbol)}
                  className={`w-full px-4 py-3 text-left hover:bg-purple/20 transition-colors border-b border-white/5 last:border-b-0 ${
                    index === selectedIndex ? "bg-purple/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-white">
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-gray-400 line-clamp-1">
                        {stock.name}
                      </div>
                    </div>
                    <Search className="w-4 h-4 text-purple opacity-50" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-purple text-white rounded-lg hover:bg-purple/90 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Track Stock
        </button>
      </form>
    </div>
  );
}
