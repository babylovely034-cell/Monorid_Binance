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
          quantityPrecision: s.quantityPrecision ?? 3,
          pricePrecision: s.pricePrecision ?? 2
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
  const numSteps = Math.floor((value / step) + 1e-9);
  const stepStr = step.toString();
  const precision = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  return Number((numSteps * step).toFixed(precision));
}

export function roundToTick(value: number, tick: number): number {
  if (!tick || tick <= 0) return value;
  const numTicks = Math.round((value / tick) + 1e-9);
  const tickStr = tick.toString();
  const precision = tickStr.includes('.') ? tickStr.split('.')[1].length : 0;
  return Number((numTicks * tick).toFixed(precision));
}

/**
 * Formats quantity as exact fixed decimal string avoiding scientific notation
 */
export function formatQuantity(value: number, stepSize: number, precision?: number): string {
  if (!stepSize || stepSize <= 0) return String(value);
  const stepStr = stepSize.toString();
  const stepDecimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
  const prec = precision !== undefined ? Math.min(stepDecimals, precision) : stepDecimals;
  const numSteps = Math.floor((value / stepSize) + 1e-9);
  const truncated = numSteps * stepSize;
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
  const numTicks = Math.round((value / tickSize) + 1e-9);
  const rounded = numTicks * tickSize;
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

  // Also query Binance Algo Orders (/fapi/v1/openAlgoOrders) for conditional TP/SL orders
  let openAlgoOrders: any[] = [];
  try {
    const algoRes = await sendSignedRequest('GET', '/fapi/v1/openAlgoOrders', {}, apiKey, apiSecret);
    if (Array.isArray(algoRes)) {
      openAlgoOrders = algoRes;
    }
  } catch {
    const activeSymbols = Array.from(new Set(
      (Array.isArray(positionRisks) ? positionRisks : [])
        .filter((p: any) => parseFloat(p.positionAmt) !== 0)
        .map((p: any) => p.symbol)
    ));
    for (const sym of activeSymbols) {
      try {
        const symAlgo = await sendSignedRequest('GET', '/fapi/v1/openAlgoOrders', { symbol: sym }, apiKey, apiSecret);
        if (Array.isArray(symAlgo)) {
          openAlgoOrders.push(...symAlgo);
        }
      } catch {}
    }
  }

  const allActiveOrders = [
    ...(Array.isArray(openOrders) ? openOrders : []),
    ...(Array.isArray(openAlgoOrders) ? openAlgoOrders : [])
  ];

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
      const isPosLong = amt > 0;

      // Find open SL and TP orders for this symbol across both regular and algo orders
      const symbolOrders = allActiveOrders.filter((o: any) => o.symbol === p.symbol);
      const getOrderPrice = (o: any) => parseFloat(o.triggerPrice || o.stopPrice || o.price || '0');

      const isSL = (o: any) => {
        const type = o.orderType || o.type || o.origType || '';
        if (['STOP_MARKET', 'STOP', 'STOP_LOSS', 'STOP_LOSS_LIMIT'].includes(type)) return true;
        const trigger = parseFloat(o.triggerPrice || o.stopPrice || '0');
        if (trigger > 0) {
          return isPosLong ? trigger < markPrice : trigger > markPrice;
        }
        return false;
      };

      const isTP = (o: any) => {
        const type = o.orderType || o.type || o.origType || '';
        if (['TAKE_PROFIT_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT'].includes(type)) return true;
        const trigger = parseFloat(o.triggerPrice || o.stopPrice || '0');
        if (trigger > 0) {
          return isPosLong ? trigger > markPrice : trigger < markPrice;
        }
        if ((o.reduceOnly === true || o.reduceOnly === 'true') && parseFloat(o.price || '0') > 0) {
          const limitPrice = parseFloat(o.price);
          return isPosLong ? limitPrice > markPrice : limitPrice < markPrice;
        }
        return false;
      };

      const slOrder = symbolOrders.find(isSL);
      const tpOrder = symbolOrders.find(isTP);

      const slPrice = slOrder ? getOrderPrice(slOrder) : 0;
      const tpPrice = tpOrder ? getOrderPrice(tpOrder) : 0;

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
        stopLoss: slPrice,
        takeProfit: tpPrice,
        stopLossOrderId: slOrder?.algoId || slOrder?.orderId,
        takeProfitOrderId: tpOrder?.algoId || tpOrder?.orderId,
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
 * Places a conditional Stop Loss or Take Profit order using Binance Algo Order API (/fapi/v1/algoOrder)
 * with multi-tier fallback support.
 */
export async function placeConditionalOrder(
  params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
    triggerPrice: string;
    quantity: string;
    isDualSide: boolean;
    isLong: boolean;
  },
  apiKey: string,
  apiSecret: string
): Promise<any> {
  const { symbol, side, type, triggerPrice, quantity, isDualSide, isLong } = params;

  // Tier 1: Binance Algo Order API (/fapi/v1/algoOrder)
  try {
    const algoParams: Record<string, any> = {
      algoType: 'CONDITIONAL',
      symbol,
      side,
      type,
      triggerPrice,
      workingType: 'MARK_PRICE',
      priceProtect: 'TRUE'
    };

    if (isDualSide) {
      algoParams.positionSide = isLong ? 'LONG' : 'SHORT';
      algoParams.quantity = quantity;
    } else {
      algoParams.positionSide = 'BOTH';
      algoParams.closePosition = 'true';
    }

    return await sendSignedRequest('POST', '/fapi/v1/algoOrder', algoParams, apiKey, apiSecret);
  } catch (algoErr1: any) {
    // Tier 2: If closePosition was rejected in One-Way mode, retry with reduceOnly: 'true' and quantity
    if (!isDualSide) {
      try {
        const algoParamsReduceOnly: Record<string, any> = {
          algoType: 'CONDITIONAL',
          symbol,
          side,
          type,
          triggerPrice,
          quantity,
          reduceOnly: 'true',
          positionSide: 'BOTH',
          workingType: 'MARK_PRICE',
          priceProtect: 'TRUE'
        };
        return await sendSignedRequest('POST', '/fapi/v1/algoOrder', algoParamsReduceOnly, apiKey, apiSecret);
      } catch (algoErr2: any) {
        // Tier 3: Legacy /fapi/v1/order endpoint fallback
        try {
          const legacyParams: Record<string, any> = {
            symbol,
            side,
            type,
            stopPrice: triggerPrice,
            workingType: 'MARK_PRICE'
          };
          if (isDualSide) {
            legacyParams.positionSide = isLong ? 'LONG' : 'SHORT';
            legacyParams.quantity = quantity;
          } else {
            legacyParams.positionSide = 'BOTH';
            legacyParams.closePosition = 'true';
          }
          return await sendSignedRequest('POST', '/fapi/v1/order', legacyParams, apiKey, apiSecret);
        } catch {
          throw new Error(algoErr1?.message || algoErr2?.message || 'Failed to place conditional order on Binance');
        }
      }
    }
    throw algoErr1;
  }
}

/**
 * Cancels all open regular orders AND open algorithmic conditional orders for a symbol
 */
export async function cancelOpenPositionOrders(symbol: string, apiKey: string, apiSecret: string): Promise<void> {
  // Cancel standard open orders
  try {
    await sendSignedRequest('DELETE', '/fapi/v1/allOpenOrders', { symbol }, apiKey, apiSecret);
  } catch {}

  // Cancel open algo orders
  try {
    await sendSignedRequest('DELETE', '/fapi/v1/algoOpenOrders', { symbol }, apiKey, apiSecret);
  } catch {}
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

  let effectiveMargin = margin;
  let notional = effectiveMargin * leverage;

  // For symbols requiring $5 min notional or near threshold, clamp margin to meet minNotional floor
  if (notional < minNotional && (minNotional <= 5.5 || minNotional - notional <= 0.1)) {
    effectiveMargin = (minNotional + 0.05) / leverage;
    notional = effectiveMargin * leverage;
  }

  if (notional < minNotional - 0.001) {
    const minReqMargin = minNotional / leverage;
    throw new Error(`Order notional ($${notional.toFixed(2)}) is below Binance minimum threshold ($${minNotional.toFixed(2)}). Requires at least $${minReqMargin.toFixed(2)} margin at ${leverage}x leverage.`);
  }

  let rawQty = notional / currentPrice;
  let formattedQty = formatQuantity(rawQty, stepSize, quantityPrecision);
  let quantity = parseFloat(formattedQty);

  // Guard against floor/truncation precision causing actual executed notional to drop below minNotional
  if (quantity * currentPrice < minNotional) {
    quantity = roundToStep(quantity + stepSize, stepSize);
    formattedQty = formatQuantity(quantity, stepSize, quantityPrecision);
  }

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

  // 6. Place Stop Loss Order (STOP_MARKET) via Algo Order API
  let stopLossOrder: any = null;
  let stopLossError: string | null = null;
  const formattedSL = formatPrice(stopLoss, tickSize, pricePrecision);
  try {
    stopLossOrder = await placeConditionalOrder({
      symbol,
      side: exitSide,
      type: 'STOP_MARKET',
      triggerPrice: formattedSL,
      quantity: formattedQty,
      isDualSide,
      isLong: side === 'LONG'
    }, apiKey, apiSecret);
  } catch (slErr: any) {
    stopLossError = slErr?.message || String(slErr);
    console.error(`Failed to place Stop Loss for ${symbol}:`, slErr);
  }

  // 7. Place Take Profit Order (TAKE_PROFIT_MARKET) via Algo Order API
  let takeProfitOrder: any = null;
  let takeProfitError: string | null = null;
  const formattedTP = formatPrice(takeProfit, tickSize, pricePrecision);
  try {
    takeProfitOrder = await placeConditionalOrder({
      symbol,
      side: exitSide,
      type: 'TAKE_PROFIT_MARKET',
      triggerPrice: formattedTP,
      quantity: formattedQty,
      isDualSide,
      isLong: side === 'LONG'
    }, apiKey, apiSecret);
  } catch (tpErr: any) {
    takeProfitError = tpErr?.message || String(tpErr);
    console.error(`Failed to place Take Profit for ${symbol}:`, tpErr);
  }

  return {
    success: true,
    symbol,
    side,
    executedPrice,
    quantity: parseFloat(formattedQty),
    leverage,
    margin: effectiveMargin,
    entryOrderId: entryOrder.orderId,
    stopLossOrderId: stopLossOrder?.algoId || stopLossOrder?.orderId,
    takeProfitOrderId: takeProfitOrder?.algoId || takeProfitOrder?.orderId,
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
  const pos = Array.isArray(positionRisks)
    ? (positionRisks.find((p: any) => p.symbol === symbol && parseFloat(p.positionAmt) !== 0) || positionRisks.find((p: any) => p.symbol === symbol))
    : null;
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

  // 2. Cancel all remaining regular & algorithmic open orders for this symbol
  await cancelOpenPositionOrders(symbol, apiKey, apiSecret);

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
export async function getRealUserTradeHistory(apiKey: string, apiSecret: string, symbol?: string, limit: number = 50, startTime?: number) {
  const params: Record<string, any> = { limit };
  if (symbol) params.symbol = symbol;
  if (startTime) params.startTime = startTime;

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

/**
 * Sets or updates protective Take Profit and Stop Loss for an active open position
 */
export async function setOrUpdatePositionTPSL(
  symbol: string,
  apiKey: string,
  apiSecret: string,
  customStopLoss?: number,
  customTakeProfit?: number
) {
  // 1. Fetch current open position
  const positionRisks = await sendSignedRequest('GET', '/fapi/v2/positionRisk', { symbol }, apiKey, apiSecret);
  const pos = Array.isArray(positionRisks)
    ? (positionRisks.find((p: any) => p.symbol === symbol && parseFloat(p.positionAmt) !== 0) || positionRisks.find((p: any) => p.symbol === symbol))
    : null;
  const posAmt = pos ? parseFloat(pos.positionAmt) : 0;

  if (posAmt === 0) {
    throw new Error(`No open position found for ${symbol} on Binance USDT-M Futures.`);
  }

  const isLong = posAmt > 0;
  const entryPrice = parseFloat(pos.entryPrice);
  const markPrice = parseFloat(pos.markPrice);
  const currentPrice = markPrice > 0 ? markPrice : entryPrice;
  const liqPrice = parseFloat(pos.liquidationPrice) || 0;

  // 2. Precision filters
  const filters = await getExchangeSymbolFilters();
  const filter = filters.get(symbol);
  const tickSize = filter?.tickSize || 0.01;
  const stepSize = filter?.stepSize || 0.001;
  const pricePrecision = filter?.pricePrecision || 2;
  const isDualSide = await getDualSidePosition(apiKey, apiSecret);
  const formattedQty = formatQuantity(Math.abs(posAmt), stepSize, filter?.quantityPrecision);

  // 3. Calculate SL & TP if not explicitly supplied (1:2 Risk to Reward standard)
  let stopLoss = customStopLoss;
  let takeProfit = customTakeProfit;

  if (isLong) {
    // For LONG: SL must be strictly below currentPrice (at least 0.4% below, default 1.2% below)
    if (!stopLoss || stopLoss >= currentPrice * 0.996) {
      stopLoss = currentPrice * 0.988;
    }
    // Liquidation shield: SL must be above liquidation price
    if (liqPrice > 0 && stopLoss <= liqPrice) {
      const safeAboveLiq = liqPrice * 1.005;
      if (safeAboveLiq < currentPrice * 0.996) {
        stopLoss = safeAboveLiq;
      } else {
        stopLoss = (currentPrice + liqPrice) / 2;
      }
    }

    // For LONG: TP must be strictly above currentPrice with 1:2 Risk to Reward
    const risk = Math.max(currentPrice - stopLoss, currentPrice * 0.005);
    const minReward = Math.max(risk * 2, currentPrice * 0.01);
    if (!takeProfit || takeProfit <= currentPrice * 1.004) {
      takeProfit = currentPrice + minReward;
    }
  } else {
    // For SHORT: SL must be strictly above currentPrice (at least 0.4% above, default 1.2% above)
    if (!stopLoss || stopLoss <= currentPrice * 1.004) {
      stopLoss = currentPrice * 1.012;
    }
    // Liquidation shield: SL must be below liquidation price
    if (liqPrice > 0 && stopLoss >= liqPrice) {
      const safeBelowLiq = liqPrice * 0.995;
      if (safeBelowLiq > currentPrice * 1.004) {
        stopLoss = safeBelowLiq;
      } else {
        stopLoss = (currentPrice + liqPrice) / 2;
      }
    }

    // For SHORT: TP must be strictly below currentPrice with 1:2 Risk to Reward
    const risk = Math.max(stopLoss - currentPrice, currentPrice * 0.005);
    const minReward = Math.max(risk * 2, currentPrice * 0.01);
    if (!takeProfit || takeProfit >= currentPrice * 0.996) {
      takeProfit = currentPrice - minReward;
    }
  }

  let formattedSL = formatPrice(stopLoss, tickSize, pricePrecision);
  let formattedTP = formatPrice(takeProfit, tickSize, pricePrecision);

  // Guarantee formatted SL and TP never round to equal or cross currentPrice
  const numSL = parseFloat(formattedSL);
  const numTP = parseFloat(formattedTP);
  if (isLong) {
    if (numSL >= currentPrice) {
      formattedSL = formatPrice(currentPrice - tickSize * 2, tickSize, pricePrecision);
    }
    if (numTP <= currentPrice) {
      formattedTP = formatPrice(currentPrice + tickSize * 4, tickSize, pricePrecision);
    }
  } else {
    if (numSL <= currentPrice) {
      formattedSL = formatPrice(currentPrice + tickSize * 2, tickSize, pricePrecision);
    }
    if (numTP >= currentPrice) {
      formattedTP = formatPrice(currentPrice - tickSize * 4, tickSize, pricePrecision);
    }
  }

  const exitSide = isLong ? 'SELL' : 'BUY';

  // 4. Cancel existing open orders for symbol to prevent multiple conflicting SL/TP orders
  await cancelOpenPositionOrders(symbol, apiKey, apiSecret);

  // 5. Place Stop Loss Order (STOP_MARKET) via Algo Order API
  let stopLossOrder: any = null;
  let stopLossError: string | null = null;
  try {
    stopLossOrder = await placeConditionalOrder({
      symbol,
      side: exitSide,
      type: 'STOP_MARKET',
      triggerPrice: formattedSL,
      quantity: formattedQty,
      isDualSide,
      isLong
    }, apiKey, apiSecret);
  } catch (err: any) {
    stopLossError = err?.message || String(err);
  }

  // 6. Place Take Profit Order (TAKE_PROFIT_MARKET) via Algo Order API
  let takeProfitOrder: any = null;
  let takeProfitError: string | null = null;
  try {
    takeProfitOrder = await placeConditionalOrder({
      symbol,
      side: exitSide,
      type: 'TAKE_PROFIT_MARKET',
      triggerPrice: formattedTP,
      quantity: formattedQty,
      isDualSide,
      isLong
    }, apiKey, apiSecret);
  } catch (err: any) {
    takeProfitError = err?.message || String(err);
  }

  if (!stopLossOrder && !takeProfitOrder) {
    throw new Error(`Failed to place TP/SL for ${symbol}. SL: ${stopLossError || 'Failed'}; TP: ${takeProfitError || 'Failed'}`);
  }

  return {
    success: true,
    symbol,
    side: isLong ? ('LONG' as const) : ('SHORT' as const),
    currentPrice,
    stopLoss: stopLossOrder ? parseFloat(formattedSL) : 0,
    takeProfit: takeProfitOrder ? parseFloat(formattedTP) : 0,
    stopLossOrderId: stopLossOrder?.algoId || stopLossOrder?.orderId,
    takeProfitOrderId: takeProfitOrder?.algoId || takeProfitOrder?.orderId,
    stopLossError,
    takeProfitError
  };
}

/**
 * Protects all active Binance Futures positions that lack Stop Loss or Take Profit
 */
export async function setOrUpdateAllPositionsTPSL(apiKey: string, apiSecret: string) {
  // 1. Fetch current open positions
  const positionRisks = await sendSignedRequest('GET', '/fapi/v2/positionRisk', {}, apiKey, apiSecret);
  const activePositions = (Array.isArray(positionRisks) ? positionRisks : [])
    .filter((p: any) => parseFloat(p.positionAmt) !== 0);

  if (activePositions.length === 0) {
    return {
      success: true,
      totalPositions: 0,
      protectedCount: 0,
      results: [],
      message: 'No open positions found on Binance Futures to protect.'
    };
  }

  // 2. Fetch current open regular & algo orders to identify positions without SL or TP
  let openOrders: any[] = [];
  try {
    openOrders = await sendSignedRequest('GET', '/fapi/v1/openOrders', {}, apiKey, apiSecret);
  } catch {}

  let openAlgoOrders: any[] = [];
  try {
    const algoRes = await sendSignedRequest('GET', '/fapi/v1/openAlgoOrders', {}, apiKey, apiSecret);
    if (Array.isArray(algoRes)) {
      openAlgoOrders = algoRes;
    }
  } catch {}

  const allOrders = [
    ...(Array.isArray(openOrders) ? openOrders : []),
    ...(Array.isArray(openAlgoOrders) ? openAlgoOrders : [])
  ];

  const results: any[] = [];
  for (const pos of activePositions) {
    const sym = pos.symbol;
    const symOrders = allOrders.filter((o: any) => o.symbol === sym);
    const isLong = parseFloat(pos.positionAmt) > 0;
    const markPrice = parseFloat(pos.markPrice);

    const hasSL = symOrders.some((o: any) => {
      const type = o.orderType || o.type || o.origType || '';
      if (['STOP_MARKET', 'STOP', 'STOP_LOSS', 'STOP_LOSS_LIMIT'].includes(type)) return true;
      const trigger = parseFloat(o.triggerPrice || o.stopPrice || '0');
      return trigger > 0 && (isLong ? trigger < markPrice : trigger > markPrice);
    });

    const hasTP = symOrders.some((o: any) => {
      const type = o.orderType || o.type || o.origType || '';
      if (['TAKE_PROFIT_MARKET', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT'].includes(type)) return true;
      const trigger = parseFloat(o.triggerPrice || o.stopPrice || '0');
      if (trigger > 0) return isLong ? trigger > markPrice : trigger < markPrice;
      if ((o.reduceOnly === true || o.reduceOnly === 'true') && parseFloat(o.price || '0') > 0) {
        const limitPrice = parseFloat(o.price);
        return isLong ? limitPrice > markPrice : limitPrice < markPrice;
      }
      return false;
    });

    // If missing SL or TP, place full 1:2 RR protection
    if (!hasSL || !hasTP) {
      try {
        const res = await setOrUpdatePositionTPSL(sym, apiKey, apiSecret);
        results.push(res);
      } catch (err: any) {
        results.push({
          success: false,
          symbol: sym,
          error: err?.message || String(err)
        });
      }
    }
  }

  return {
    success: true,
    totalPositions: activePositions.length,
    protectedCount: results.filter(r => r.success).length,
    results
  };
}
