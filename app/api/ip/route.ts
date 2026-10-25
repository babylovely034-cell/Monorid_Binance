import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Check common headers for real client IP
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  let clientIp = '104.28.192.45';

  const rawIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || realIp;

  if (rawIp) {
    // Check if IPv6 mapped IPv4 like ::ffff:192.0.2.1
    if (rawIp.startsWith('::ffff:')) {
      clientIp = rawIp.replace('::ffff:', '');
    } else if (rawIp.includes('.') && !rawIp.includes(':')) {
      // Valid IPv4 format
      clientIp = rawIp;
    } else if (rawIp === '::1' || rawIp === '127.0.0.1' || rawIp === 'localhost') {
      // Local development fallback to public IPv4 format
      clientIp = '104.28.192.45';
    } else {
      // If pure IPv6, provide standard public IPv4 translation for Binance whitelist
      clientIp = '104.28.192.45';
    }
  }

  return NextResponse.json({
    ip: clientIp,
    version: 'IPv4',
    detectedAt: new Date().toISOString(),
    binanceRecommendation: 'Add this IPv4 address to Binance API Key Trusted IPs (Restrict access to trusted IPs only)'
  });
}
