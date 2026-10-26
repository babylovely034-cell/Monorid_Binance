import { NextRequest, NextResponse } from 'next/server';
import { closeRealPosition } from '@/lib/binanceClient';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
  const apiSecret = req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      success: false,
      message: 'Binance API credentials missing.'
    }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json({
        success: false,
        message: 'Symbol is required to close position.'
      }, { status: 400 });
    }

    const closeResult = await closeRealPosition(symbol, apiKey, apiSecret);
    return NextResponse.json({
      success: true,
      result: closeResult
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || 'Failed to close position on Binance'
    }, { status: 500 });
  }
}
