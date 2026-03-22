"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveGrid } from "@/components/InteractiveGrid";
import { Button } from "@/components/ui/button";
import { TrendingUp, UserPlus } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate signup sequence before routing to dashboard
    setTimeout(() => {
      // Save name for the dashboard to display
      localStorage.setItem("toro_user", name || "Trader");
      setIsLoading(false);
      router.push("/");
    }, 1500);
  };

  return (
    <div className="bg-black min-h-screen text-white flex items-center justify-center relative flex-col overflow-hidden">
      {/* Background matches the main app styling */}
      <InteractiveGrid />

      {/* Professional Signup Card */}
      <div className="z-10 relative bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(16,185,129,0.05)] mx-4">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <TrendingUp className="w-10 h-10 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-500/30 blur-xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Create an account
          </h1>
          <p className="text-gray-400 text-sm">
            Join Toro to elevate your personal wealth management.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all tracking-widest text-sm"
              placeholder="••••••••"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-6 rounded-lg transition-all flex justify-center items-center text-base mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Sign Up
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-white font-medium hover:text-emerald-400 transition-colors">Log in</Link>
        </div>
      </div>
    </div>
  );
}