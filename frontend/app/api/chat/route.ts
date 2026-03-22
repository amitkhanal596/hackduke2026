import { NextRequest, NextResponse } from "next/server";
import { normalizeLocale } from "@/lib/locale";

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, locale } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const normalizedLocale = normalizeLocale(
      locale || request.headers.get("x-user-locale") || "en-US",
    );

    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const authorization = request.headers.get("authorization");

    const proxyResponse = await fetch(`${backendBaseUrl}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-locale": normalizedLocale,
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify({
        message,
        session_id,
        locale: normalizedLocale,
      }),
    });

    const data = await proxyResponse.json();

    if (!proxyResponse.ok) {
      return NextResponse.json(
        { error: data?.detail || data?.error || "Failed to process message" },
        { status: proxyResponse.status }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("WealthVisor chat error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process message" },
      { status: 500 }
    );
  }
}
