import { NextRequest, NextResponse } from 'next/server';
import { getBinanceKlines } from '@/lib/binanceClient';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '5m';
  const limit = parseInt(searchParams.get('limit') || '60', 10);

  try {
    const klines = await getBinanceKlines(symbol, interval, limit);
    return NextResponse.json({
      success: true,
      symbol,
      interval,
      klines
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      symbol,
      klines: [],
      message: error?.message || `Failed to fetch klines for ${symbol}`
    }, { status: 500 });
  }
}
