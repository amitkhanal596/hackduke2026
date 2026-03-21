"use client";

import { useState } from "react";
import { TrendingUp, Plus, BarChart3, Newspaper, MessageSquare, Volume2, ArrowRight } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: TrendingUp,
      title: "Welcome to Toro",
      description: "Your intelligent financial tracking platform with real-time market analysis and AI-powered insights.",
      features: [
        "Real-time stock tracking",
        "AI-powered market analysis", 
        "Voice news commentary",
        "Smart event detection"
      ]
    },
    {
      icon: Plus,
      title: "Add Your First Stock",
      description: "Start by adding stocks you want to track. We'll monitor news, events, and market sentiment for each one.",
      features: [
        "Search from 5000+ stocks",
        "Instant market data",
        "Custom watchlists",
        "Price alerts"
      ]
    },
    {
      icon: BarChart3,
      title: "Track & Analyze",
      description: "Monitor your portfolio with advanced analytics, news sentiment, and upcoming events that could impact your investments.",
      features: [
        "Portfolio dashboard",
        "News sentiment analysis",
        "Event impact tracking",
        "Performance metrics"
      ]
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Insights",
      description: "Chat with WealthVisor AI for personalized market insights, investment advice, and portfolio recommendations.",
      features: [
        "24/7 AI assistance",
        "Personalized insights",
        "Market predictions",
        "Risk assessment"
      ]
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <Icon className="w-16 h-16 text-purple mx-auto" />
            <div className="absolute inset-0 bg-purple/50 blur-xl" />
          </div>
          
          <h2 className="font-black text-3xl tracking-tight mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-gray-400 text-lg mb-6">
            {currentStepData.description}
          </p>

          {/* Features List */}
          <div className="grid grid-cols-2 gap-3 text-left">
            {currentStepData.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-purple rounded-full" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-purple hover:bg-purple/80 rounded-lg transition-colors"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
