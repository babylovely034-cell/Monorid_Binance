import { NextRequest, NextResponse } from 'next/server';
import { getRealUserTradeHistory } from '@/lib/binanceClient';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
  const apiSecret = req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      success: false,
      trades: [],
      message: 'Binance credentials required for trade history.'
    }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || undefined;
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const rawTrades = await getRealUserTradeHistory(apiKey, apiSecret, symbol, limit);
    return NextResponse.json({
      success: true,
      trades: Array.isArray(rawTrades) ? rawTrades : []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      trades: [],
      message: error?.message || 'Failed to fetch Binance trade history'
    }, { status: 500 });
  }
}
