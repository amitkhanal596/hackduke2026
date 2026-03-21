"use client";

import * as React from "react";
import { useRef, useState, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
// Input removed; using Textarea for multi-line messages
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface AgentChatProps {
  placeholder?: string;
  className?: string;
  initialMessage?: string;
  autoSend?: boolean;
}

export default function AgentChat({
  placeholder = "Ask WealthVisor...",
  className,
  initialMessage,
  autoSend = false
}: AgentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const hasAutoSent = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-send initial message
  useEffect(() => {
    if (initialMessage && autoSend && !hasAutoSent.current && !isSending) {
      hasAutoSent.current = true;
      sendMessageWithContent(initialMessage);
    }
  }, [initialMessage, autoSend]);

  const sendMessageWithContent = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
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
      console.error("Agent chat error:", e);
      const errorMessage = e?.response?.data?.detail || e?.message || "Unknown error occurred";
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I couldn't reach the agent service. Error: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    setInput("");
    await sendMessageWithContent(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={cn("flex flex-col bg-card border border-border rounded-lg w-full h-full overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex justify-center items-center bg-primary/10 rounded-md w-8 h-8 text-primary">
          <Bot size={18} />
        </div>
        <div className="font-medium text-sm">WealthVisor</div>
        <div className="ml-auto text-muted-foreground text-xs">{isSending ? "Thinking..." : "Online"}</div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-muted-foreground text-sm">
            Start the conversation — ask about markets, events, or your portfolio.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3 w-full", m.role === "user" ? "justify-end" : "justify-start")}> 
              {m.role === "assistant" && (
                <div className="flex justify-center items-center bg-primary/10 mt-1 rounded-md w-7 h-7 text-primary">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={cn(
                  "px-3 py-2 rounded-md max-w-[80%] text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs">{children}</code>,
                        h1: ({ children }) => <h1 className="font-bold text-base mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="font-bold text-sm mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
              {m.role === "user" && (
                <div className="flex justify-center items-center bg-primary/10 mt-1 rounded-md w-7 h-7 text-primary">
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1"
            rows={3}
          />
          <Button onClick={sendMessage} disabled={isSending || input.trim().length === 0} className="self-stretch gap-1">
            <Send size={16} />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}


