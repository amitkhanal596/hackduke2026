import { NextRequest, NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/locale";

const TRANSLATE_TARGETS: Record<string, string> = {
  es: "Spanish",
  hi: "Hindi",
  fr: "French",
  de: "German",
  ar: "Arabic",
  "pt-BR": "Brazilian Portuguese",
  ja: "Japanese",
  "zh-CN": "Simplified Chinese",
};

async function translateSummary(summary: string, locale: string, apiKey: string): Promise<string> {
  if (!summary || locale === "en-US") {
    return summary;
  }

  const targetLanguage = TRANSLATE_TARGETS[locale];
  if (!targetLanguage) {
    return summary;
  }

  const translatePrompt = `Translate the following financial market summary into ${targetLanguage}.\n\nRules:\n- Preserve markdown-style bullets and structure\n- Keep stock tickers, numbers, dates, percentages, and currency values unchanged\n- Preserve financial tone and meaning\n- Return only the translated summary text\n\nSummary:\n${summary}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: translatePrompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error("Gemini translation request failed");
  }

  const data = await response.json();
  const translated = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!translated) {
    throw new Error("Gemini translation returned empty output");
  }

  return translated;
}

async function tryGemini(prompt: string, apiKey: string) {
  // First, try to get the list of available models
  const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const modelsResponse = await fetch(modelsUrl);
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json();
      const modelNames = modelsData.models?.map((m: any) => m.name).join(", ") || "none";
      console.log("📋 Available Gemini models:", modelNames);
    }
  } catch (e) {
    console.log("❌ Could not fetch models list");
  }

  // Try different model configurations - using newer Gemini models
  const tryConfigs = [
    { version: 'v1beta', model: 'gemini-2.5-flash' },
    { version: 'v1beta', model: 'gemini-2.5-flash' },
    { version: 'v1beta', model: 'gemini-flash-latest' },
  ];

  for (const config of tryConfigs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${apiKey}`;
      console.log(`🔄 Trying ${config.version} with ${config.model}...`);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (summary) {
          console.log(`✅ Success with ${config.version}/${config.model}`);
          return summary;
        }
      } else {
        const errorData = await response.json();
        console.log(`❌ Failed ${config.version}/${config.model}:`, errorData.error?.message);
      }
    } catch (err) {
      console.log(`❌ Error ${config.version}/${config.model}:`, err);
    }
  }

  throw new Error("Gemini API: No compatible model found. Try creating a new API key at https://aistudio.google.com/app/apikey");
}

async function tryOpenAI(prompt: string, apiKey: string) {
  console.log("🔄 Trying OpenAI API...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI: ${errorData.error?.message || 'API error'}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content;

  if (summary) {
    console.log("✅ Success with OpenAI");
    return summary;
  }

  throw new Error("OpenAI: Empty response");
}

async function tryGroq(prompt: string, apiKey: string) {
  console.log("🔄 Trying Groq API...");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq: ${errorData.error?.message || 'API error'}`);
  }

  const data = await response.json();
  const summary = data.choices?.[0]?.message?.content;

  if (summary) {
    console.log("✅ Success with Groq");
    return summary;
  }

  throw new Error("Groq: Empty response");
}

export async function POST(request: NextRequest) {
  try {
    const { articles, locale } = await request.json();
    const normalizedLocale = normalizeLocale(
      locale || request.headers.get("x-user-locale") || "en-US",
    );

    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json(
        { error: "Articles array is required" },
        { status: 400 }
      );
    }

    // Format articles for summarization
    const articlesText = articles
      .map((article: any, index: number) => {
        return `${index + 1}. ${article.title}\n   Source: ${article.source}\n   Summary: ${article.summary || "No summary available"}`;
      })
      .join("\n\n");

    const prompt = `You are a financial news analyst. Summarize the following stock market news articles into key insights. Focus on:
1. Major market trends
2. Significant company events
3. Economic indicators
4. Investment opportunities or risks

Format the summary in clear, concise bullet points. Be objective and highlight the most important information.

News Articles:
${articlesText}

Provide a comprehensive summary:`;

    // Try different AI providers in order of preference
    const providers = [
      { name: 'Gemini', key: process.env.GEMINI_API_KEY, fn: tryGemini },
      { name: 'OpenAI', key: process.env.OPENAI_API_KEY, fn: tryOpenAI },
      { name: 'Groq', key: process.env.GROQ_API_KEY, fn: tryGroq },
    ];

    let summary: string | null = null;
    const errors: string[] = [];

    for (const provider of providers) {
      if (!provider.key || provider.key === "your_gemini_api_key_here" || provider.key === "your_openai_api_key_here" || provider.key === "your_groq_api_key_here") {
        console.log(`⏭️  Skipping ${provider.name} (no API key configured)`);
        continue;
      }

      try {
        console.log(`\n🚀 Attempting ${provider.name}...`);
        summary = await provider.fn(prompt, provider.key);
        if (summary) break;
      } catch (err: any) {
        const errorMsg = err.message || err.toString();
        errors.push(`${provider.name}: ${errorMsg}`);
        console.log(`❌ ${provider.name} failed:`, errorMsg);
      }
    }

    if (!summary) {
      const configuredProviders = providers.filter(p => p.key && !p.key.includes("your_"));

      if (configuredProviders.length === 0) {
        return NextResponse.json(
          {
            error: "No AI API keys configured. Please add GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY to your .env.local file.\n\n" +
                   "Quick Setup:\n" +
                   "1. Gemini (Free): https://aistudio.google.com/app/apikey\n" +
                   "2. Groq (Free & Fast): https://console.groq.com/keys\n" +
                   "3. OpenAI (Paid): https://platform.openai.com/api-keys"
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "All AI providers failed:\n" + errors.join("\n") +
                 "\n\nTry:\n1. Creating a new API key\n2. Using a different provider (Groq is free!)"
        },
        { status: 500 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let translatedSummary = summary;
    let translationStatus: "not-requested" | "translated" | "fallback-original" = "not-requested";

    if (geminiKey && normalizedLocale !== "en-US") {
      try {
        translatedSummary = await translateSummary(summary, normalizedLocale, geminiKey);
        translationStatus = "translated";
      } catch (translationError) {
        console.error("Summary translation failed, using original summary:", translationError);
        translationStatus = "fallback-original";
      }
    }

    return NextResponse.json({
      summary: translatedSummary,
      locale: normalizedLocale,
      translation_status: translationStatus,
      original_summary: translationStatus === "translated" ? summary : undefined,
    });
  } catch (error: any) {
    console.error("Error summarizing news:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate summary" },
      { status: 500 }
    );
  }
}
