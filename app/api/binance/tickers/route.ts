import { NextResponse } from 'next/server';
import { getBinance24hrTickers } from '@/lib/binanceClient';

export async function GET() {
  try {
    const tickers = await getBinance24hrTickers();
    return NextResponse.json({
      success: true,
      tickers: Array.isArray(tickers) ? tickers : []
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      tickers: [],
      message: error?.message || 'Failed to fetch Binance 24hr tickers'
    }, { status: 500 });
  }
}
