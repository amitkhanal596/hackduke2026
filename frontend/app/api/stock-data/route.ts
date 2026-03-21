import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  // Mock stock data - replace with real API call
  const mockStockData = {
    price: Math.random() * 200 + 50,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    volume: Math.floor(Math.random() * 10000000),
    marketCap: `${(Math.random() * 1000 + 100).toFixed(0)}B`,
    high: Math.random() * 200 + 50,
    low: Math.random() * 200 + 50,
    open: Math.random() * 200 + 50,
    previousClose: Math.random() * 200 + 50,
    timestamp: new Date().toISOString()
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(mockStockData);
}
