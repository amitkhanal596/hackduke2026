"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Plus,
  BarChart3,
  Newspaper,
  MessageSquare,
  Volume2,
  Settings,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ 
  activeSection, 
  onSectionChange, 
  isCollapsed, 
  onToggleCollapse 
}: SidebarProps) {
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Overview & Analytics"
    },
    {
      id: "add-stocks",
      label: "Add Stocks",
      icon: Plus,
      description: "Track New Stocks"
    },
    {
      id: "news",
      label: "News Feed",
      icon: Newspaper,
      description: "Market News"
    },
    {
      id: "chat",
      label: "AI Chat",
      icon: MessageSquare,
      description: "WealthVisor AI"
    },
    {
      id: "voice-news",
      label: "Voice News",
      icon: Volume2,
      description: "Audio Commentary"
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggleCollapse}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 64 : 288, // 16rem = 64px, 72rem = 288px
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        className={`
          fixed top-0 left-0 h-full bg-black/90 backdrop-blur-xl border-r border-white/10 z-50
          lg:relative
          transition-transform duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          shadow-[0_0_20px_rgba(16,185,129,0.1)] shadow-green/20
        `}
        style={{
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.08), inset 0 0 20px rgba(16, 185, 129, 0.03)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center flex-1"
              >
                <span
                  className="font-bold text-2xl text-white"
                  style={{
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(255, 255, 255, 0.2), 0 0 30px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Menu
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                layout
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-200
                  ${isActive
                    ? 'bg-green/20 border border-green/30 text-green'
                    : 'hover:bg-white/10 text-gray-300 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-green' : ''}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 text-left overflow-hidden"
                    >
                      <div 
                        className="font-semibold text-base whitespace-nowrap"
                        style={{
                          textShadow: '0 0 4px rgba(255, 255, 255, 0.1), 0 0 8px rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-400 whitespace-nowrap">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors">
                <Settings className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold text-base">Settings</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
