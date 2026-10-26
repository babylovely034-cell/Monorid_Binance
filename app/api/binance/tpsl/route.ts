import { NextRequest, NextResponse } from 'next/server';
import { setOrUpdatePositionTPSL } from '@/lib/binanceClient';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
  const apiSecret = req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      success: false,
      message: 'Binance API credentials missing. Please configure your API key.'
    }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { symbol, stopLoss, takeProfit } = body;

    if (!symbol) {
      return NextResponse.json({
        success: false,
        message: 'Symbol is required to set TP and SL.'
      }, { status: 400 });
    }

    const result = await setOrUpdatePositionTPSL(symbol, apiKey, apiSecret, stopLoss, takeProfit);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to place TP and SL on Binance'
    }, { status: 500 });
  }
}
