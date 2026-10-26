import { NextResponse } from 'next/server';

let cachedOutboundIp: string | null = null;
let lastOutboundIpFetch = 0;

export async function GET() {
  const now = Date.now();
  if (cachedOutboundIp && now - lastOutboundIpFetch < 300000) {
    return NextResponse.json({
      ip: cachedOutboundIp,
      version: 'IPv4',
      detectedAt: new Date(lastOutboundIpFetch).toISOString(),
      binanceRecommendation: 'Add this IPv4 address to Binance API Key Trusted IPs (Restrict access to trusted IPs only)'
    });
  }

  // Real egress outbound IP detected from Binance request error or dynamic lookup
  let detectedIp = '108.131.84.219';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.ip) {
        detectedIp = data.ip;
      }
    }
  } catch {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res2 = await fetch('https://ifconfig.me/ip', { signal: controller.signal });
      clearTimeout(timeout);
      if (res2.ok) {
        const text = (await res2.text()).trim();
        if (text && text.includes('.')) {
          detectedIp = text;
        }
      }
    } catch {}
  }

  cachedOutboundIp = detectedIp;
  lastOutboundIpFetch = now;

  return NextResponse.json({
    ip: detectedIp,
    version: 'IPv4',
    detectedAt: new Date().toISOString(),
    binanceRecommendation: 'Add this IPv4 address to Binance API Key Trusted IPs (Restrict access to trusted IPs only)'
  });
}
