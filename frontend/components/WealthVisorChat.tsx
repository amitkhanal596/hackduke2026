"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Bot, User, X, MessageSquare, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface WealthVisorChatProps {
  hideButton?: boolean;
}

export default function WealthVisorChat({ hideButton = false }: WealthVisorChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Drag functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: position.x + e.movementX,
          y: position.y + e.movementY,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // Reset position when maximizing/minimizing
  useEffect(() => {
    if (isMaximized) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isMaximized]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await api.post<{ session_id: string; reply: string }>("/agent/chat", {
          message: trimmed,
          session_id: sessionIdRef.current,
      });
      sessionIdRef.current = response.data.session_id;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.detail || e?.message || "Unknown error occurred";
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I couldn't process your request. Error: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-500 ${
        hideButton ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative group"
        >
          {/* Animated orb background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-full blur-xl opacity-60 group-hover:opacity-90 animate-pulse transition-opacity"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full blur-lg opacity-40 group-hover:opacity-70 animate-pulse transition-opacity" style={{ animationDelay: '1s' }}></div>

          {/* Main button */}
          <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full shadow-2xl group-hover:scale-110 transition-all duration-300 overflow-hidden"
            style={{
              boxShadow: '0 0 40px rgba(16, 185, 129, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center gap-0 group-hover:gap-3 p-5 transition-all duration-300">
              {/* Icon - perfectly centered */}
              <MessageSquare className="w-7 h-7 shrink-0 group-hover:rotate-12 transition-transform duration-300" />

              {/* Expandable text */}
              <span className="w-0 overflow-hidden group-hover:w-auto group-hover:pl-3 transition-all duration-500 whitespace-nowrap font-black text-base tracking-wide">
                ASK WEALTHVISOR
              </span>
            </div>

            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-300 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700"></div>
          </div>

          {/* Floating particles */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute top-1/2 -right-2 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.6s' }}></div>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={chatRef}
      className={`fixed z-50 flex flex-col overflow-hidden transition-all duration-300 ${
        isMaximized
          ? 'inset-0 w-screen h-screen rounded-none'
          : 'w-[500px] h-[700px] rounded-xl'
      }`}
      style={{
        ...(isMaximized ? {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        } : {
          bottom: '24px',
          right: '32px',
          transform: `translate(${position.x}px, ${position.y}px)`
        }),
        background: 'rgba(0, 0, 0, 0.95)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        boxShadow: '0 0 50px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.05)'
      }}
    >
      {/* Terminal Header */}
      <div
        ref={dragRef}
        className={`border-b border-emerald-500/20 bg-black/98 backdrop-blur-md select-none ${!isMaximized ? 'cursor-move' : ''}`}
        onMouseDown={() => !isMaximized && setIsDragging(true)}
      >
        {/* Terminal Top Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-500/50 text-xs font-mono">
            <span className="w-3 h-3 rounded-full bg-red-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/70"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/70"></span>
            <span className="ml-4">WEALTHVISOR_AI.exe</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-emerald-500/50 hover:text-emerald-400 transition-colors p-1"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-500/50 hover:text-emerald-400 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title Bar */}
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 font-mono text-sm animate-pulse">▶</span>
            <div className="flex items-center gap-3">
              <div className="flex justify-center items-center bg-emerald-500/10 rounded-lg w-10 h-10 border border-emerald-500/30">
                <Bot className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-emerald-400 text-base font-mono tracking-tight">
                  WEALTHVISOR
                </div>
                <div className="text-emerald-500/60 text-xs font-mono">
                  {isSending ? "[PROCESSING...]" : "[AI_FINANCIAL_ADVISOR]"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto bg-black"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Bot className="w-20 h-20 text-emerald-400 relative z-10" />
            </div>
            <div className="space-y-2">
              <p className="text-emerald-400 text-lg font-mono font-bold">
                [WEALTHVISOR_INITIALIZED]
              </p>
              <p className="text-gray-500 text-sm font-mono max-w-sm">
                &gt; Ask me about markets, stocks, investments, or financial strategies
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex justify-center items-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-emerald-400" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-lg max-w-[80%] text-sm leading-relaxed font-mono ${
                  m.role === "assistant"
                    ? "bg-black/50 text-gray-300 border border-emerald-500/20"
                    : "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border border-emerald-400/50"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold text-emerald-300">{children}</strong>,
                        code: ({ children }) => <code className="bg-black/50 px-1 py-0.5 rounded text-xs">{children}</code>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex justify-center items-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
              )}
            </div>
          ))
        )}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="flex justify-center items-center bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="bg-black/50 border border-emerald-500/20 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-black border-t border-emerald-500/20">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="> Type your question..."
            className="flex-1 bg-black/50 border border-emerald-500/20 rounded-lg px-4 py-3 text-gray-300 text-sm font-mono resize-none focus:outline-none focus:border-emerald-500/60 transition-colors placeholder:text-gray-600"
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={isSending || input.trim().length === 0}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 transition-all flex items-center gap-2 h-[80px] shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-emerald-500/50 text-xs font-mono mt-3">
          [ENTER] send | [SHIFT+ENTER] new line
        </p>
      </div>
    </div>
  );
}
