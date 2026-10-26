import { NextRequest, NextResponse } from 'next/server';
import { testBinanceConnectivity } from '@/lib/binanceClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = body.apiKey || req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
    const apiSecret = body.apiSecret || req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: 'API Key or Secret is missing. Please enter both keys to test live Binance Futures connection.'
      }, { status: 400 });
    }

    const result = await testBinanceConnectivity(apiKey, apiSecret);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to connect to Binance Futures'
    }, { status: 400 });
  }
}
