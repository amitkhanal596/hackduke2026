"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AssistantState = "stopped" | "idle" | "recording" | "processing" | "speaking";

const STATE_CONFIG: Record<AssistantState, { label: string; color: string; pulse: boolean }> = {
  stopped:    { label: "TORO",        color: "border-white/20 text-white/60",                          pulse: false },
  idle:       { label: "TORO",        color: "border-green-500/60 text-green-400 bg-green-500/10",     pulse: true  },
  recording:  { label: "LISTENING",   color: "border-blue-500/80 text-blue-300 bg-blue-500/20",        pulse: true  },
  processing: { label: "THINKING",    color: "border-yellow-500/70 text-yellow-300 bg-yellow-500/15",  pulse: false },
  speaking:   { label: "SPEAKING",    color: "border-purple-500/70 text-purple-300 bg-purple-500/15",  pulse: true  },
};

export default function ToroVoiceButton() {
  const [running, setRunning]   = useState(false);
  const [vaState, setVaState]   = useState<AssistantState>("stopped");
  const [loading, setLoading]   = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/voice-assistant/status`);
      if (res.ok) {
        const { running: r, state: s } = await res.json();
        setRunning(r);
        setVaState((r ? s : "stopped") as AssistantState);
      }
    } catch {
      // backend may not be up yet
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 1 s so the recording→blue transition feels instant
    pollRef.current = setInterval(fetchStatus, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const toggle = async () => {
    setLoading(true);
    try {
      const endpoint = running ? "stop" : "start";
      await fetch(`${API}/voice-assistant/${endpoint}`, { method: "POST" });
      await new Promise((r) => setTimeout(r, 600));
      await fetchStatus();
    } catch (e) {
      console.error("Voice assistant toggle failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const cfg = STATE_CONFIG[vaState];

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={
        !running ? "Start Toro voice assistant" :
        vaState === "recording" ? "Toro is listening to your request" :
        vaState === "processing" ? "Toro is thinking…" :
        vaState === "speaking" ? "Toro is speaking (say \"stop\" to interrupt)" :
        "Toro is waiting for wake word — say \"toro\""
      }
      className={[
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
        "font-mono font-bold text-sm border",
        cfg.color,
        loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:brightness-125",
      ].join(" ")}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : vaState === "processing" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : running ? (
        <Mic className={["w-4 h-4", cfg.pulse ? "animate-pulse" : ""].join(" ")} />
      ) : (
        <MicOff className="w-4 h-4" />
      )}
      {loading ? "…" : cfg.label}
    </button>
  );
}
