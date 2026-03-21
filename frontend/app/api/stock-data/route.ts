import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Simple in-memory cache to prevent duplicate requests
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  const tickerUpper = ticker.toUpperCase();
  const cacheKey = `stock_${tickerUpper}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Call backend /price endpoint
    const response = await fetch(`${API_URL}/price/${tickerUpper}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const priceData = await response.json();

    // Transform backend PriceData to frontend StockData format
    const stockData = {
      price: priceData.current_price,
      change: priceData.change_1d,
      changePercent: priceData.change_1d_percent,
      volume: 0, // Not provided by backend price endpoint
      marketCap: 'N/A', // Not provided by backend price endpoint
      timestamp: new Date().toISOString()
    };

    // Cache the result
    cache.set(cacheKey, { data: stockData, timestamp: Date.now() });

    return NextResponse.json(stockData);
  } catch (error) {
    console.error(`Error fetching stock data for ${tickerUpper}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
