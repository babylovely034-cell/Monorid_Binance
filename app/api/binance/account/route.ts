import { NextRequest, NextResponse } from 'next/server';
import { getBinanceAccountOverview } from '@/lib/binanceClient';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
  const apiSecret = req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      success: false,
      isLiveConnected: false,
      message: 'Binance Futures API credentials missing. Please configure your API key in Settings.'
    }, { status: 400 });
  }

  try {
    const overview = await getBinanceAccountOverview(apiKey, apiSecret);
    return NextResponse.json({
      success: true,
      isLiveConnected: true,
      ...overview
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      isLiveConnected: false,
      message: error?.message || 'Failed to fetch Binance account overview'
    }, { status: 500 });
  }
}
