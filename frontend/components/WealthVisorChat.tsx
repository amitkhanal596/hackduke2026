"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Bot, User, X, MessageSquare, Maximize2, Minimize2, Move } from "lucide-react";

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
          x: e.clientX - 200, // Offset for center of chat
          y: e.clientY - 50,  // Offset for top of chat
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
  }, [isDragging]);

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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          session_id: sessionIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      sessionIdRef.current = data.session_id;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I couldn't process your request. Please try again.",
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
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-green hover:bg-green/90 text-white rounded-full p-5 shadow-lg hover:scale-110 flex items-center gap-3 group transition-all duration-300 ${
          hideButton ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), inset 0 0 10px rgba(16, 185, 129, 0.1)'
        }}
      >
        <MessageSquare className="w-7 h-7" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold text-lg">
          Ask WealthVisor
        </span>
      </button>
    );
  }

  return (
    <div
      ref={chatRef}
      className={`fixed z-50 bg-black border border-green/30 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isMaximized
          ? 'inset-0 w-screen h-screen rounded-none'
          : 'bottom-6 right-6 w-[500px] h-[700px] rounded-xl'
      }`}
      style={{
        ...(!isMaximized ? {
          transform: `translate(${position.x}px, ${position.y}px)`
        } : {}),
        boxShadow: '0 0 35px rgba(16, 185, 129, 0.12), inset 0 0 25px rgba(16, 185, 129, 0.04)'
      }}
    >
      {/* Header */}
      <div 
        ref={dragRef}
        className="bg-gradient-to-r from-green to-green/80 px-4 py-3 flex items-center justify-between cursor-move select-none"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-white/20 rounded-lg w-12 h-12">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <div 
              className="font-black text-white text-lg"
              style={{
                textShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.2)'
              }}
            >
              WealthVisor
            </div>
            <div className="text-white/80 text-sm">
              {isSending ? "Thinking..." : "Your AI Financial Advisor"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="text-white/80 hover:text-white transition-colors p-1"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto bg-gradient-to-b from-black to-gray-900"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <Bot className="w-20 h-20 text-green mb-6" />
            <p className="text-gray-400 text-lg mb-3">
              Hi! I'm WealthVisor, your AI financial advisor.
            </p>
            <p className="text-gray-500 text-sm">
              Ask me about markets, investments, or financial planning!
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="flex justify-center items-center bg-green/20 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-green" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-lg max-w-[80%] text-base leading-relaxed ${
                  m.role === "assistant"
                    ? "bg-white/5 text-gray-200 border border-white/10"
                    : "bg-green text-white"
                }`}
              >
                <div
                  className="whitespace-pre-wrap [&_strong]:font-bold [&_strong]:text-white"
                  dangerouslySetInnerHTML={{
                    __html: m.content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              </div>
              {m.role === "user" && (
                <div className="flex justify-center items-center bg-green/20 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-green" />
                </div>
              )}
            </div>
          ))
        )}
        {isSending && (
          <div className="flex gap-3 justify-start">
            <div className="flex justify-center items-center bg-green/20 rounded-lg w-10 h-10 flex-shrink-0 mt-1">
              <Bot className="w-5 h-5 text-green" />
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-black/80 border-t border-white/10">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about stocks, investments, or financial advice..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base resize-none focus:outline-none focus:border-green transition-colors"
            rows={3}
          />
          <button
            onClick={sendMessage}
            disabled={isSending || input.trim().length === 0}
            className="bg-green hover:bg-green/80 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 transition-colors flex items-center gap-2 h-[80px]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 text-sm mt-3">
          💡 Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
