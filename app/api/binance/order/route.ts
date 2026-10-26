import { NextRequest, NextResponse } from 'next/server';
import { executeRealTrade } from '@/lib/binanceClient';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-binance-api-key') || process.env.BINANCE_API_KEY || '';
  const apiSecret = req.headers.get('x-binance-api-secret') || process.env.BINANCE_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    return NextResponse.json({
      success: false,
      message: 'Binance API credentials missing. Cannot execute real trade without API key and secret.'
    }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { symbol, side, margin, leverage, stopLoss, takeProfit } = body;

    if (!symbol || !side || !margin || !leverage || !stopLoss || !takeProfit) {
      return NextResponse.json({
        success: false,
        message: 'Missing required trade execution parameters (symbol, side, margin, leverage, stopLoss, takeProfit).'
      }, { status: 400 });
    }

    const tradeResult = await executeRealTrade(
      { symbol, side, margin, leverage, stopLoss, takeProfit },
      apiKey,
      apiSecret
    );

    return NextResponse.json({
      success: true,
      trade: tradeResult
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || 'Trade execution failed on Binance Futures'
    }, { status: 500 });
  }
}
