/**
 * Monorid Proprietary Quantitative Trading Engine
 * Binance USDT-M Futures API Client (Production Live REST)
 * Copyright (c) 2026 Trading Lifestyle Quant. All rights reserved.
 */

import crypto from 'crypto';

const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com';

export interface BinanceSymbolFilter {
  symbol: string;
  stepSize: number;
  tickSize: number;
  minQty: number;
  minNotional: number;
  quantityPrecision: number;
  pricePrecision: number;
}

let cachedExchangeInfo: Map<string, BinanceSymbolFilter> | null = null;
let lastExchangeInfoFetch = 0;

export function signQuery(queryString: string, apiSecret: string): string {
  return crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
}

/**
 * Fetches and caches symbol precision and lot size limits from Binance Futures
 */
export async function getExchangeSymbolFilters(): Promise<Map<string, BinanceSymbolFilter>> {
  const now = Date.now();
  if (cachedExchangeInfo && now - lastExchangeInfoFetch < 3600000) {
    return cachedExchangeInfo;
  }

  try {
    const res = await fetch(`${BINANCE_FUTURES_BASE_URL}/fapi/v1/exchangeInfo`);
    if (!res.ok) {
      if (cachedExchangeInfo) return cachedExchangeInfo;
      throw new Error(`Failed to fetch Binance exchangeInfo: ${res.statusText}`);
    }
    const data = await res.json();
    const map = new Map<string, BinanceSymbolFilter>();

    if (Array.isArray(data.symbols)) {
      for (const s of data.symbols) {
        let stepSize = 0.001;
        let tickSize = 0.01;
        let minQty = 0.001;
        let minNotional = 5.0;

        if (Array.isArray(s.filters)) {
          for (const f of s.filters) {
            if (f.filterType === 'LOT_SIZE') {
              stepSize = parseFloat(f.stepSize) || stepSize;
              minQty = parseFloat(f.minQty) || minQty;
            } else if (f.filterType === 'PRICE_FILTER') {
              tickSize = parseFloat(f.tickSize) || tickSize;
            } else if (f.filterType === 'MIN_NOTIONAL') {
              minNotional = parseFloat(f.notional) || minNotional;
            }
          }
        }

        map.set(s.symbol, {
          symbol: s.symbol,
          stepSize,
          tickSize,
          minQty,
          minNotional,
          quantityPrecision: s.quantityPrecision || 3,
          pricePrecision: s.pricePrecision || 2
        });
      }
    }

    cachedExchangeInfo = map;
    lastExchangeInfoFetch = now;
    return map;
  } catch (err) {
    if (cachedExchangeInfo) return cachedExchangeInfo;
    return new Map();
  }
}

/**
 * Rounds value down to exact stepSize or precision
 */
export function roundToStep(value: number, step: number): number {
  if (!step || step <= 0) return value;
  const precision = Math.max(0, Math.round(-Math.log10(step)));
  const factor = 10 ** precision;
  return Math.floor(value * factor) / factor;
}

export function roundToTick(value: number, tick: number): number {
  if (!tick || tick <= 0) return value;
  const precision = Math.max(0, Math.round(-Math.log10(tick)));
  return Number(value.toFixed(precision));
}

/**
 * Formats quantity as exact fixed decimal string avoiding scientific notation
 */
export function formatQuantity(value: number, stepSize: number, precision?: number): string {
  if (!stepSize || stepSize <= 0) return String(value);
  const stepStr = stepSize.toString();
  const stepDecimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  const prec = precision !== undefined ? Math.min(stepDecimals, precision) : stepDecimals;
  const factor = 10 ** prec;
  const truncated = Math.floor(value * factor) / factor;
  return truncated.toFixed(prec);
}

/**
 * Formats price as exact fixed decimal string avoiding scientific notation
 */
export function formatPrice(value: number, tickSize: number, precision?: number): string {
  if (!tickSize || tickSize <= 0) return String(value);
  const tickStr = tickSize.toString();
  const tickDecimals = tickStr.includes('.') ? tickStr.split('.')[1].length : 0;
  const prec = precision !== undefined ? Math.min(tickDecimals, precision) : tickDecimals;
  const factor = 10 ** prec;
  const rounded = Math.round(value * factor) / factor;
  return rounded.toFixed(prec);
}

let cachedDualSidePosition: boolean | null = null;
let lastDualSideCheck = 0;

/**
 * Checks if Binance account is in Dual-Side (Hedge) Mode or One-Way Mode
 */
export async function getDualSidePosition(apiKey: string, apiSecret: string): Promise<boolean> {
  const now = Date.now();
  if (cachedDualSidePosition !== null && now - lastDualSideCheck < 300000) {
    return cachedDualSidePosition;
  }
  try {
    const res = await sendSignedRequest('GET', '/fapi/v1/positionSide/dual', {}, apiKey, apiSecret);
    cachedDualSidePosition = res?.dualSidePosition === true;
    lastDualSideCheck = now;
    return cachedDualSidePosition;
  } catch {
    return false; // Default to One-Way Mode if check fails
  }
}

/**
 * Generic signed request helper for Binance USDT-M Futures
 */
export async function sendSignedRequest(
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  apiKey: string,
  apiSecret: string
): Promise<any> {
  if (!apiKey || !apiSecret) {
    throw new Error('Binance Futures API Key and Secret are required.');
  }

  const timestamp = Date.now();
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  }

  searchParams.append('recvWindow', '60000');
  searchParams.append('timestamp', String(timestamp));

  const queryStr = searchParams.toString();
  const signature = signQuery(queryStr, apiSecret);
  const fullQuery = `${queryStr}&signature=${signature}`;

  let url = `${BINANCE_FUTURES_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'X-MBX-APIKEY': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };

  if (method === 'GET' || method === 'DELETE') {
    url = `${url}?${fullQuery}`;
  } else {
    options.body = fullQuery;
  }

  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    const errorMsg = responseData?.msg || response.statusText;
    const errorCode = responseData?.code || response.status;
    throw new Error(`Binance API Error [${errorCode}]: ${errorMsg}`);
  }

  return responseData;
}

/**
 * Test connectivity & credentials
 */
export async function testBinanceConnectivity(apiKey: string, apiSecret: string): Promise<{ success: boolean; message: string; pingMs: number }> {
  const start = Date.now();
  // 1. Public ping
  const pingRes = await fetch(`${BINANCE_FUTURES_BASE_URL}/fapi/v1/time`);
  const pingMs = Date.now() - start;
  if (!pingRes.ok) {
    throw new Error('Binance Futures API is currently unreachable.');
  }

  // 2. Authenticated account check
  const account = await sendSignedRequest('GET', '/fapi/v2/account', {}, apiKey, apiSecret);
  if (!account || account.totalWalletBalance === undefined) {
    throw new Error('API Key validated, but unable to retrieve account balance.');
  }

  return {
    success: true,
    message: `Connected successfully! Binance USDT-M Futures active. Total Wallet Balance: $${parseFloat(account.totalWalletBalance).toFixed(2)} USDT`,
    pingMs
  };
}

/**
 * Get Account Balance & Overview
 */
export async function getBinanceAccountOverview(apiKey: string, apiSecret: string) {
  const account = await sendSignedRequest('GET', '/fapi/v2/account', {}, apiKey, apiSecret);
  const positionRisks = await sendSignedRequest('GET', '/fapi/v2/positionRisk', {}, apiKey, apiSecret);

  let openOrders: any[] = [];
  let openOrdersError: string | null = null;
  try {
    openOrders = await sendSignedRequest('GET', '/fapi/v1/openOrders', {}, apiKey, apiSecret);
  } catch (err: any) {
    openOrdersError = err?.message || 'Failed to fetch openOrders';
    const activeSymbols = Array.from(new Set(
      (Array.isArray(positionRisks) ? positionRisks : [])
        .filter((p: any) => parseFloat(p.positionAmt) !== 0)
        .map((p: any) => p.symbol)
    ));
    for (const sym of activeSymbols) {
      try {
        const symOrders = await sendSignedRequest('GET', '/fapi/v1/openOrders', { symbol: sym }, apiKey, apiSecret);
        if (Array.isArray(symOrders)) {
          openOrders.push(...symOrders);
        }
      } catch {}
    }
  }

  const walletBalance = parseFloat(account.totalWalletBalance || '0');
  const availableBalance = parseFloat(account.availableBalance || '0');
  const unrealizedProfit = parseFloat(account.totalUnrealizedProfit || '0');
  const marginBalance = parseFloat(account.totalMarginBalance || '0');

  // Filter positions where positionAmt !== 0
  const openPositions = (Array.isArray(positionRisks) ? positionRisks : [])
    .filter((p: any) => parseFloat(p.positionAmt) !== 0)
    .map((p: any) => {
      const amt = parseFloat(p.positionAmt);
      const entryPrice = parseFloat(p.entryPrice);
      const markPrice = parseFloat(p.markPrice);
      const leverage = parseInt(p.leverage, 10);
      const margin = parseFloat(p.isolatedWallet) || (Math.abs(amt) * entryPrice) / leverage;
      const unRealizedProfit = parseFloat(p.unRealizedProfit);
      const netPnlPercent = margin > 0 ? (unRealizedProfit / margin) * 100 : 0;

      // Find open SL and TP orders for this symbol
      const symbolOrders = Array.isArray(openOrders) ? openOrders.filter((o: any) => o.symbol === p.symbol) : [];
      const slOrder = symbolOrders.find((o: any) => o.type === 'STOP_MARKET' || o.type === 'STOP');
      const tpOrder = symbolOrders.find((o: any) => o.type === 'TAKE_PROFIT_MARKET' || o.type === 'TAKE_PROFIT');

      return {
        id: `binance-${p.symbol}-${p.updateTime || Date.now()}`,
        symbol: p.symbol,
        category: 'live-binance',
        side: amt > 0 ? ('LONG' as const) : ('SHORT' as const),
        entryPrice,
        currentPrice: markPrice,
        markPrice,
        quantity: Math.abs(amt),
        leverage,
        signalStrength: leverage >= 15 ? ('BEST' as const) : ('GOOD' as const),
        margin,
        entryTime: p.updateTime || Date.now(),
        stopLoss: slOrder ? parseFloat(slOrder.stopPrice) : 0,
        takeProfit: tpOrder ? parseFloat(tpOrder.stopPrice) : 0,
        stopLossOrderId: slOrder?.orderId,
        takeProfitOrderId: tpOrder?.orderId,
        liquidationPrice: parseFloat(p.liquidationPrice) || 0,
        recentSwingPrice: entryPrice,
        grossPnl: unRealizedProfit,
        feesPaid: 0,
        netPnl: unRealizedProfit,
        netPnlPercent,
        status: 'OPEN' as const
      };
    });

  return {
    walletBalance,
    availableBalance,
    unrealizedProfit,
    marginBalance,
    openPositions,
    openOrdersError
  };
}

/**
 * Set Leverage for a symbol
 */
export async function setBinanceLeverage(symbol: string, leverage: number, apiKey: string, apiSecret: string) {
  return await sendSignedRequest('POST', '/fapi/v1/leverage', {
    symbol,
    leverage
  }, apiKey, apiSecret);
}

/**
 * Place a Market Order with SL and TP
 */
export async function executeRealTrade(
  params: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    margin: number;
    leverage: number;
    stopLoss: number;
    takeProfit: number;
  },
  apiKey: string,
  apiSecret: string
) {
  const { symbol, side, margin, leverage, stopLoss, takeProfit } = params;

  // 1. Fetch Symbol Filter precision
  const filters = await getExchangeSymbolFilters();
  const filter = filters.get(symbol);
  const stepSize = filter?.stepSize || 0.001;
  const tickSize = filter?.tickSize || 0.01;
  const quantityPrecision = filter?.quantityPrecision || 3;
  const pricePrecision = filter?.pricePrecision || 2;
  const minNotional = filter?.minNotional || 5.0;

  // 2. Set Leverage on Binance
  try {
    await setBinanceLeverage(symbol, leverage, apiKey, apiSecret);
  } catch (err: any) {
    // Continue even if leverage is already set to this value
  }

  // 3. Check Dual Side Position Mode
  const isDualSide = await getDualSidePosition(apiKey, apiSecret);

  // 4. Get latest price to calculate quantity
  const priceRes = await fetch(`${BINANCE_FUTURES_BASE_URL}/fapi/v1/ticker/price?symbol=${symbol}`);
  const priceData = await priceRes.json();
  const currentPrice = parseFloat(priceData.price);

  if (!currentPrice || currentPrice <= 0) {
    throw new Error(`Unable to fetch real execution price for ${symbol}`);
  }

  const notional = margin * leverage;
  if (notional < minNotional) {
    const minReqMargin = minNotional / leverage;
    throw new Error(`Order notional ($${notional.toFixed(2)}) is below Binance minimum threshold ($${minNotional.toFixed(2)}). Requires at least $${minReqMargin.toFixed(2)} margin at ${leverage}x leverage.`);
  }

  const rawQty = notional / currentPrice;
  const formattedQty = formatQuantity(rawQty, stepSize, quantityPrecision);
  const quantity = parseFloat(formattedQty);

  if (quantity < (filter?.minQty || 0.0001)) {
    throw new Error(`Order size ${formattedQty} for ${symbol} is below minimum allowed lot size (${filter?.minQty}).`);
  }

  // 5. Primary Entry Order (MARKET)
  const orderSide = side === 'LONG' ? 'BUY' : 'SELL';
  const entryParams: Record<string, any> = {
    symbol,
    side: orderSide,
    type: 'MARKET',
    quantity: formattedQty
  };
  if (isDualSide) {
    entryParams.positionSide = side === 'LONG' ? 'LONG' : 'SHORT';
  } else {
    entryParams.positionSide = 'BOTH';
  }

  const entryOrder = await sendSignedRequest('POST', '/fapi/v1/order', entryParams, apiKey, apiSecret);
  const executedPrice = parseFloat(entryOrder.avgPrice) || currentPrice;
  const exitSide = side === 'LONG' ? 'SELL' : 'BUY';

  // 6. Place Stop Loss Order (STOP_MARKET)
  let stopLossOrder: any = null;
  let stopLossError: string | null = null;
  const formattedSL = formatPrice(stopLoss, tickSize, pricePrecision);
  try {
    const slParams: Record<string, any> = {
      symbol,
      side: exitSide,
      type: 'STOP_MARKET',
      stopPrice: formattedSL,
      workingType: 'MARK_PRICE'
    };
    if (isDualSide) {
      slParams.positionSide = side === 'LONG' ? 'LONG' : 'SHORT';
      slParams.quantity = formattedQty;
    } else {
      slParams.positionSide = 'BOTH';
      slParams.closePosition = 'true';
    }
    stopLossOrder = await sendSignedRequest('POST', '/fapi/v1/order', slParams, apiKey, apiSecret);
  } catch (slErr: any) {
    stopLossError = slErr?.message || String(slErr);
    console.error(`Failed to place Stop Loss for ${symbol}:`, slErr);
  }

  // 7. Place Take Profit Order (TAKE_PROFIT_MARKET)
  let takeProfitOrder: any = null;
  let takeProfitError: string | null = null;
  const formattedTP = formatPrice(takeProfit, tickSize, pricePrecision);
  try {
    const tpParams: Record<string, any> = {
      symbol,
      side: exitSide,
      type: 'TAKE_PROFIT_MARKET',
      stopPrice: formattedTP,
      workingType: 'MARK_PRICE'
    };
    if (isDualSide) {
      tpParams.positionSide = side === 'LONG' ? 'LONG' : 'SHORT';
      tpParams.quantity = formattedQty;
    } else {
      tpParams.positionSide = 'BOTH';
      tpParams.closePosition = 'true';
    }
    takeProfitOrder = await sendSignedRequest('POST', '/fapi/v1/order', tpParams, apiKey, apiSecret);
  } catch (tpErr: any) {
    takeProfitError = tpErr?.message || String(tpErr);
    console.error(`Failed to place Take Profit for ${symbol}:`, tpErr);
  }

  return {
    success: true,
    symbol,
    side,
    executedPrice,
    quantity,
    leverage,
    margin,
    entryOrderId: entryOrder.orderId,
    stopLossOrderId: stopLossOrder?.orderId,
    takeProfitOrderId: takeProfitOrder?.orderId,
    stopLoss: parseFloat(formattedSL),
    takeProfit: parseFloat(formattedTP),
    stopLossError,
    takeProfitError
  };
}

/**
 * Emergency Market Close of an open position and cancel its open orders
 */
export async function closeRealPosition(
  symbol: string,
  apiKey: string,
  apiSecret: string
) {
  // 1. Fetch current open position size
  const positionRisks = await sendSignedRequest('GET', '/fapi/v2/positionRisk', { symbol }, apiKey, apiSecret);
  const pos = Array.isArray(positionRisks) ? positionRisks.find((p: any) => p.symbol === symbol) : null;
  const posAmt = pos ? parseFloat(pos.positionAmt) : 0;

  let closeOrder = null;
  if (posAmt !== 0) {
    const filters = await getExchangeSymbolFilters();
    const filter = filters.get(symbol);
    const stepSize = filter?.stepSize || 0.001;
    const isDualSide = await getDualSidePosition(apiKey, apiSecret);

    const closeSide = posAmt > 0 ? 'SELL' : 'BUY';
    const closeQty = formatQuantity(Math.abs(posAmt), stepSize, filter?.quantityPrecision);

    const closeParams: Record<string, any> = {
      symbol,
      side: closeSide,
      type: 'MARKET',
      quantity: closeQty
    };

    if (isDualSide) {
      closeParams.positionSide = posAmt > 0 ? 'LONG' : 'SHORT';
    } else {
      closeParams.positionSide = 'BOTH';
      closeParams.reduceOnly = 'true';
    }

    closeOrder = await sendSignedRequest(
      'POST',
      '/fapi/v1/order',
      closeParams,
      apiKey,
      apiSecret
    );
  }

  // 2. Cancel all remaining open orders for this symbol (TP / SL)
  try {
    await sendSignedRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol }, apiKey, apiSecret);
  } catch (err) {
    // Ignore if no open orders exist
  }

  return {
    success: true,
    symbol,
    closedAmount: posAmt,
    orderId: closeOrder?.orderId
  };
}

/**
 * Fetch real user trade history from Binance
 */
export async function getRealUserTradeHistory(apiKey: string, apiSecret: string, symbol?: string, limit: number = 50) {
  const params: Record<string, any> = { limit };
  if (symbol) params.symbol = symbol;

  const trades = await sendSignedRequest('GET', '/fapi/v1/userTrades', params, apiKey, apiSecret);
  return trades;
}

/**
 * Fetch real 5m historical candles from Binance (Public API)
 */
export async function getBinanceKlines(symbol: string, interval: string = '5m', limit: number = 60) {
  const url = `${BINANCE_FUTURES_BASE_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch klines for ${symbol}: ${res.statusText}`);
  }
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];

  return raw.map((item: any) => ({
    timestamp: item[0],
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5])
  }));
}

/**
 * Fetch real 24hr tickers for all symbols (Public API)
 */
export async function getBinance24hrTickers() {
  const url = `${BINANCE_FUTURES_BASE_URL}/fapi/v1/ticker/24hr`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch 24hr tickers: ${res.statusText}`);
  }
  return await res.json();
}
