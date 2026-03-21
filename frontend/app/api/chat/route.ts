import { NextRequest, NextResponse } from "next/server";

// In-memory session storage (for development - use Redis/DB in production)
const sessions = new Map<string, Array<{ role: string; content: string }>>();

const SYSTEM_PROMPT = `# 🧠 WealthVisor – AI Personal Wealth Manager

You are **WealthVisor**, an intelligent personal wealth manager and financial planning assistant for the StockLens platform.
Your goal is to help users **grow, manage, and understand** their personal finances through smart, data-driven, and personalized insights.
You act like a **fiduciary financial advisor** — responsible, conservative, and always in the user's best interest.

## Core Responsibilities:
1. **Understand the User's Financial Profile** - Gather details about income, savings, spending, assets, debts, risk tolerance, and goals
2. **Provide Personalized Guidance** - Offer tailored advice on budgeting, saving, investing, debt management, and retirement planning
3. **Investment Support** - Explain investment concepts, recommend theoretical asset allocations, analyze portfolios
4. **Financial Insights** - Generate summaries of spending habits, investment performance, and goal progress
5. **Education** - Teach users about financial concepts in plain English

## Communication Style:
- Friendly, analytical, and confidence-inspiring — like a CFA + patient teacher
- Avoid jargon unless explained
- Use structured responses (sections, bullet points)
- Always clarify assumptions

## Important Notes:
- You are an AI financial planning assistant, **not a licensed financial advisor**
- All insights are **educational and for informational purposes only**
- Never execute trades or financial transactions
- Always provide disclaimers when giving investment advice

Keep responses concise but informative. Use emojis sparingly for engagement.`;

async function callGemini(messages: Array<{ role: string; content: string }>, apiKey: string): Promise<string> {
  const tryConfigs = [
    { version: 'v1beta', model: 'gemini-2.5-flash' },
    { version: 'v1beta', model: 'gemini-2.0-flash' },
  ];

  // Convert messages to Gemini format
  const conversationHistory = messages.map(m => m.content).join('\n\n');
  const prompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${conversationHistory}`;

  for (const config of tryConfigs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          console.log(`✅ WealthVisor used ${config.version}/${config.model}`);
          return reply;
        }
      }
    } catch (err) {
      console.log(`❌ Failed ${config.version}/${config.model}:`, err);
      continue;
    }
  }

  throw new Error("Unable to connect to AI service");
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Get or create session
    const sessionId = session_id || crypto.randomUUID();
    let conversation = sessions.get(sessionId) || [];

    // Add user message
    conversation.push({ role: "user", content: message });

    // Keep only last 10 messages to avoid token limits
    if (conversation.length > 10) {
      conversation = conversation.slice(-10);
    }

    // Get AI response
    const reply = await callGemini(conversation, apiKey);

    // Add assistant message to conversation
    conversation.push({ role: "assistant", content: reply });

    // Save session
    sessions.set(sessionId, conversation);

    // Clean up old sessions (simple cleanup - keep only last 100)
    if (sessions.size > 100) {
      const firstKey = sessions.keys().next().value;
      if (firstKey) sessions.delete(firstKey);
    }

    return NextResponse.json({
      session_id: sessionId,
      reply: reply
    });

  } catch (error: any) {
    console.error("WealthVisor chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process message" },
      { status: 500 }
    );
  }
}
