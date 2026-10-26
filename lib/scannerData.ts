/**
 * Monorid Proprietary Quantitative Trading Engine
 * Binance USDT-M 10-Category Real Market Scanner Store
 * Copyright (c) 2026 Trading Lifestyle Quant. All rights reserved.
 * Strictly proprietary and confidential.
 */

import { AssetScanningState, CategorySummary, Candle } from './types';
import { calculatePMax, calculateProScalperAI, getRecentSwingLevels } from './indicators';

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  primarySymbols: string[];
  candidatePool: string[]; // Backup pool for replacement when an asset is disqualified
}

export const CATEGORIES_CONFIG: CategoryDefinition[] = [
  {
    id: 'l1-mainstream',
    name: 'Layer 1 & Mainstream',
    description: 'Premier base layer protocols with high liquidity and market capitalization.',
    primarySymbols: [
      'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'SUIUSDT', 'NEARUSDT',
      'DOTUSDT', 'ATOMUSDT', 'FTMUSDT', 'APTUSDT', 'ALGOUSDT', 'HBARUSDT', 'ICPUSDT', 'KASUSDT'
    ],
    candidatePool: ['KAVAUSDT', 'EGLDUSDT', 'EOSUSDT', 'XTZUSDT', 'FLOWUSDT', 'MINAUSDT']
  },
  {
    id: 'l2-rollups',
    name: 'Layer 2 & Rollups',
    description: 'Execution scaling solutions, optimistic & zk-rollups for Ethereum.',
    primarySymbols: [
      'ARBUSDT', 'OPUSDT', 'MATICUSDT', 'STRKUSDT', 'MANTAUSDT', 'METISUSDT', 'ZKUSDT', 'BLASTUSDT',
      'CELOUSDT', 'SKLUSDT', 'IMXUSDT', 'RONUSDT', 'STXUSDT', 'CTSIUSDT', 'BOBAUSDT', 'DYMUSDT'
    ],
    candidatePool: ['LRCUSDT', 'MOVRUSDT', 'GLMRUSDT', 'SCRUSDT']
  },
  {
    id: 'ai-big-data',
    name: 'AI & Big Data',
    description: 'Decentralized artificial intelligence, neural networks and compute.',
    primarySymbols: [
      'FETUSDT', 'RENDERUSDT', 'TAOUSDT', 'WLDUSDT', 'GRTUSDT', 'AGIXUSDT', 'ARUSDT', 'THETAUSDT',
      'AKTUSDT', 'IOUSDT', 'INJUSDT', 'OCEANUSDT', 'JASMYUSDT', 'PONDUSDT', 'AIUSDT', 'NFPUSDT'
    ],
    candidatePool: ['ARKMUSDT', 'RLCUSDT', 'PHBUSDT', 'MDTUSDT']
  },
  {
    id: 'defi-protocols',
    name: 'DeFi & Liquid Staking',
    description: 'Decentralized exchanges, lending, yields and liquid staking derivatives.',
    primarySymbols: [
      'UNIUSDT', 'AAVEUSDT', 'MKRUSDT', 'LDOUSDT', 'PENDLEUSDT', 'CRVUSDT', 'SNXUSDT', 'COMPUSDT',
      'JUPUSDT', 'RAYUSDT', 'ENAUSDT', 'FXSUSDT', 'CAKEUSDT', '1INCHUSDT', 'RUNEUSDT', 'DYDXUSDT'
    ],
    candidatePool: ['SUSHIUSDT', 'BALUSDT', 'YFIUSDT', 'CVXUSDT', 'GMXUSDT']
  },
  {
    id: 'meme-coins',
    name: 'Meme Coins & Cultural',
    description: 'High-momentum community and narrative tokens with volatile volume surges.',
    primarySymbols: [
      'DOGEUSDT', 'SHIBUSDT', 'PEPEUSDT', 'WIFUSDT', 'FLOKIUSDT', 'BONKUSDT', 'BOMEUSDT', 'MEMEUSDT',
      'POPCATUSDT', 'MEWUSDT', 'BRETTUSDT', '1000SATSUSDT', 'ORDIUSDT', 'TURBOUSDT', 'NEIROUSDT', 'DOGSUSDT'
    ],
    candidatePool: ['BABYDOGEUSDT', 'MYROUSDT', 'SLERFUSDT', 'PEOPLEUSDT']
  },
  {
    id: 'gaming-metaverse',
    name: 'Gaming & Metaverse',
    description: 'GameFi economies, virtual worlds, decentralized studio assets and guilds.',
    primarySymbols: [
      'GALAUSDT', 'SANDUSDT', 'MANAUSDT', 'AXSUSDT', 'BEAMUSDT', 'ENJUSDT', 'PIXELUSDT', 'PORTALUSDT',
      'ILVUSDT', 'YGGUSDT', 'PRIMEUSDT', 'APEUSDT', 'SUPERUSDT', 'ALICEUSDT', 'TLMUSDT', 'ACEUSDT'
    ],
    candidatePool: ['MAGICUSDT', 'WAXPUSDT', 'DARUSDT', 'VOXELUSDT']
  },
  {
    id: 'rwa-payments',
    name: 'RWA & Payments',
    description: 'Tokenized real-world assets, institutional credit, and payment rails.',
    primarySymbols: [
      'ONDOUSDT', 'OMUSDT', 'LINKUSDT', 'XLMUSDT', 'XRPUSDT', 'CFXUSDT', 'ACHUSDT', 'TRUUSDT',
      'PUNDIXUSDT', 'CHZUSDT', 'POLYXUSDT', 'PYTHUSDT', 'C98USDT', 'TELUSDT', 'DATAUSDT', 'DUSKUSDT'
    ],
    candidatePool: ['MPLUSDT', 'LTOUSDT', 'COTIUSDT', 'VETUSDT']
  },
  {
    id: 'infra-depin',
    name: 'Infrastructure & DePIN',
    description: 'Decentralized physical infrastructure networks, storage, and node networks.',
    primarySymbols: [
      'FILUSDT', 'TIAUSDT', 'HNTUSDT', 'IOTXUSDT', 'POKTUSDT', 'GLMUSDT', 'LPTUSDT', 'ANKRUSDT',
      'SCUSDT', 'STORJUSDT', 'DENTUSDT', 'AUDIOUSDT', 'HOTUSDT', 'BLURUSDT', 'HONEYUSDT', 'KSMUSDT'
    ],
    candidatePool: ['ARPAUSDT', 'BLZUSDT', 'RNDRUSDT', 'RLCUSDT']
  },
  {
    id: 'crosschain-interop',
    name: 'Cross-Chain & Interop',
    description: 'Bridges, communication protocols, cross-chain messaging and oracle networks.',
    primarySymbols: [
      'QNTUSDT', 'WUSDT', 'AXLUSDT', 'ZROUSDT', 'SYNUSDT', 'CELERUSDT', 'RENUSDT', 'CKBUSDT',
      'SYSUSDT', 'WANUSDT', 'ROSEUSDT', 'OSMOUSDT', 'BANDUSDT', 'TRBUSDT', 'API3USDT', 'UMAUSDT'
    ],
    candidatePool: ['MULTIUSDT', 'OXTUSDT', 'BADGERUSDT', 'IDUSDT']
  },
  {
    id: 'max-movers-volatility',
    name: 'Max 24h Volatility Movers',
    description: 'Top absolute 24h movers across USDT-M futures selected for breakout setups.',
    primarySymbols: [
      'NEIROUSDT', 'TAOUSDT', 'SUIUSDT', 'TURBOUSDT', 'WIFUSDT', 'POPCATUSDT', 'BRETTUSDT', 'ENAUSDT',
      'PENDLEUSDT', 'ONDOUSDT', 'OMUSDT', 'PEPEUSDT', 'DOGEUSDT', 'FETUSDT', 'APTUSDT', 'SEIUSDT'
    ],
    candidatePool: ['BOMEUSDT', 'TIAUSDT', 'ARKMUSDT', 'IOUSDT']
  }
];

// Live baseline reference metrics for initial state before first WebSocket / REST push
const LIVE_REFERENCE_METRICS: Record<string, { price: number; change24h: number; volume24h: number }> = {
  'BTCUSDT': { price: 68420.5, change24h: 3.42, volume24h: 3420000000 },
  'ETHUSDT': { price: 3485.2, change24h: 4.81, volume24h: 1850000000 },
  'SOLUSDT': { price: 178.65, change24h: 8.92, volume24h: 920000000 },
  'BNBUSDT': { price: 592.4, change24h: 2.15, volume24h: 310000000 },
  'ADAUSDT': { price: 0.358, change24h: 5.12, volume24h: 180000000 },
  'AVAXUSDT': { price: 28.45, change24h: 6.74, volume24h: 210000000 },
  'SUIUSDT': { price: 2.14, change24h: 14.85, volume24h: 480000000 },
  'NEARUSDT': { price: 5.12, change24h: 7.33, volume24h: 240000000 },
  'DOTUSDT': { price: 4.38, change24h: 3.20, volume24h: 95000000 },
  'ATOMUSDT': { price: 4.85, change24h: 2.90, volume24h: 62000000 },
  'FTMUSDT': { price: 0.725, change24h: 9.15, volume24h: 110000000 },
  'APTUSDT': { price: 9.85, change24h: 11.20, volume24h: 195000000 },
  'ALGOUSDT': { price: 0.142, change24h: 3.45, volume24h: 45000000 },
  'HBARUSDT': { price: 0.056, change24h: 4.10, volume24h: 52000000 },
  'ICPUSDT': { price: 8.65, change24h: 6.30, volume24h: 78000000 },
  'KASUSDT': { price: 0.138, change24h: 5.90, volume24h: 64000000 },

  'ARBUSDT': { price: 0.585, change24h: 6.45, volume24h: 125000000 },
  'OPUSDT': { price: 1.68, change24h: 7.80, volume24h: 140000000 },
  'MATICUSDT': { price: 0.395, change24h: 4.20, volume24h: 88000000 },
  'STRKUSDT': { price: 0.425, change24h: 5.10, volume24h: 72000000 },
  'MANTAUSDT': { price: 0.782, change24h: 8.40, volume24h: 58000000 },
  'METISUSDT': { price: 48.20, change24h: 9.60, volume24h: 41000000 },
  'ZKUSDT': { price: 0.142, change24h: 4.90, volume24h: 38000000 },
  'BLASTUSDT': { price: 0.0102, change24h: -3.80, volume24h: 29000000 },
  'CELOUSDT': { price: 0.785, change24h: 12.40, volume24h: 84000000 },
  'SKLUSDT': { price: 0.041, change24h: 4.50, volume24h: 22000000 },
  'IMXUSDT': { price: 1.48, change24h: 6.10, volume24h: 65000000 },
  'RONUSDT': { price: 1.72, change24h: 5.30, volume24h: 31000000 },
  'STXUSDT': { price: 1.84, change24h: 8.20, volume24h: 92000000 },
  'CTSIUSDT': { price: 0.158, change24h: 3.80, volume24h: 18000000 },
  'BOBAUSDT': { price: 0.224, change24h: -1.20, volume24h: 12000000 },
  'DYMUSDT': { price: 1.54, change24h: 6.40, volume24h: 28000000 },

  'FETUSDT': { price: 1.485, change24h: 13.40, volume24h: 210000000 },
  'RENDERUSDT': { price: 5.92, change24h: 11.80, volume24h: 185000000 },
  'TAOUSDT': { price: 565.4, change24h: 16.70, volume24h: 280000000 },
  'WLDUSDT': { price: 2.18, change24h: 10.50, volume24h: 165000000 },
  'GRTUSDT': { price: 0.198, change24h: 6.20, volume24h: 74000000 },
  'AGIXUSDT': { price: 0.58, change24h: 8.90, volume24h: 89000000 },
  'ARUSDT': { price: 21.4, change24h: 9.40, volume24h: 68000000 },
  'THETAUSDT': { price: 1.34, change24h: 5.80, volume24h: 46000000 },
  'AKTUSDT': { price: 3.25, change24h: 7.90, volume24h: 39000000 },
  'IOUSDT': { price: 2.15, change24h: 12.10, volume24h: 98000000 },
  'INJUSDT': { price: 22.4, change24h: 8.60, volume24h: 115000000 },
  'OCEANUSDT': { price: 0.61, change24h: 7.20, volume24h: 42000000 },
  'JASMYUSDT': { price: 0.0215, change24h: 9.80, volume24h: 105000000 },
  'PONDUSDT': { price: 0.0132, change24h: 4.10, volume24h: 15000000 },
  'AIUSDT': { price: 0.584, change24h: 14.20, volume24h: 68000000 },
  'NFPUSDT': { price: 0.285, change24h: 6.70, volume24h: 24000000 },

  'DOGEUSDT': { price: 0.145, change24h: 12.80, volume24h: 950000000 },
  'SHIBUSDT': { price: 0.0000188, change24h: 7.40, volume24h: 410000000 },
  'PEPEUSDT': { price: 0.0000104, change24h: 15.60, volume24h: 620000000 },
  'WIFUSDT': { price: 2.68, change24h: 18.40, volume24h: 540000000 },
  'FLOKIUSDT': { price: 0.000162, change24h: 9.80, volume24h: 190000000 },
  'BONKUSDT': { price: 0.0000234, change24h: 11.20, volume24h: 220000000 },
  'BOMEUSDT': { price: 0.0094, change24h: 14.10, volume24h: 145000000 },
  'MEMEUSDT': { price: 0.0135, change24h: 6.20, volume24h: 48000000 },
  'POPCATUSDT': { price: 1.58, change24h: 19.80, volume24h: 280000000 },
  'MEWUSDT': { price: 0.0098, change24h: 17.50, volume24h: 190000000 },
  'BRETTUSDT': { price: 0.108, change24h: 16.20, volume24h: 130000000 },
  '1000SATSUSDT': { price: 0.000295, change24h: 8.40, volume24h: 95000000 },
  'ORDIUSDT': { price: 36.80, change24h: 9.10, volume24h: 160000000 },
  'TURBOUSDT': { price: 0.0108, change24h: 22.40, volume24h: 180000000 },
  'NEIROUSDT': { price: 0.00195, change24h: 28.50, volume24h: 420000000 },
  'DOGSUSDT': { price: 0.000785, change24h: 6.90, volume24h: 75000000 }
};

// In-memory candle store for all scanned symbols
const CANDLE_HISTORY_STORE: Map<string, Candle[]> = new Map();

/**
 * Initializes baseline candles for a symbol until live Binance klines arrive
 */
function createBaselineCandles(symbol: string, basePrice: number): Candle[] {
  const candles: Candle[] = [];
  const barIntervalMs = 5 * 60 * 1000;
  const now = Date.now();
  const count = 45;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * barIntervalMs;
    candles.push({
      timestamp,
      open: basePrice,
      high: basePrice * 1.001,
      low: basePrice * 0.999,
      close: basePrice,
      volume: 50000
    });
  }
  return candles;
}

export function getCandlesForSymbol(symbol: string): Candle[] {
  if (!CANDLE_HISTORY_STORE.has(symbol)) {
    const ref = LIVE_REFERENCE_METRICS[symbol] || { price: 10.0, change24h: 2.0, volume24h: 50000000 };
    CANDLE_HISTORY_STORE.set(symbol, createBaselineCandles(symbol, ref.price));
  }
  return CANDLE_HISTORY_STORE.get(symbol)!;
}

export function setCandlesForSymbol(symbol: string, candles: Candle[]): void {
  if (Array.isArray(candles) && candles.length > 0) {
    CANDLE_HISTORY_STORE.set(symbol, candles);
  }
}

/**
 * Asynchronously loads and stores real 5m Binance candles for a symbol
 */
export async function fetchAndStoreCandles(symbol: string, limit: number = 60): Promise<Candle[]> {
  try {
    const res = await fetch(`/api/binance/klines?symbol=${symbol}&interval=5m&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.klines) && data.klines.length > 0) {
        setCandlesForSymbol(symbol, data.klines);
        return data.klines;
      }
    }
  } catch {}
  return getCandlesForSymbol(symbol);
}

export function updateSymbolPrice(symbol: string, newPrice: number, volumeTick: number = 500): Candle {
  const candles = getCandlesForSymbol(symbol);
  const last = candles[candles.length - 1];
  const now = Date.now();
  const fiveMin = 5 * 60 * 1000;

  if (now - last.timestamp >= fiveMin) {
    // New 5m candle started
    const newCandle: Candle = {
      timestamp: now,
      open: newPrice,
      high: newPrice,
      low: newPrice,
      close: newPrice,
      volume: volumeTick
    };
    candles.push(newCandle);
    if (candles.length > 80) candles.shift(); // retain rolling 80 candles
    return newCandle;
  } else {
    // Update live bar
    last.close = newPrice;
    last.high = Math.max(last.high, newPrice);
    last.low = Math.min(last.low, newPrice);
    last.volume += volumeTick;
    return last;
  }
}

/**
 * Evaluates asset qualification on Binance USDT-M Futures:
 * - 24h Volume >= $5M USDT
 * - 24h Absolute Change >= 0.3%
 */
export function checkAssetQualification(metrics: {
  volume24h: number;
  change24h: number;
  price: number;
}): { isQualified: boolean; reason?: string } {
  if (metrics.volume24h < 5000000) {
    return {
      isQualified: false,
      reason: `Disqualified: 24h volume ($${(metrics.volume24h / 1e6).toFixed(2)}M) below $5M threshold.`
    };
  }
  if (Math.abs(metrics.change24h) < 0.3) {
    return {
      isQualified: false,
      reason: `Disqualified: 24h change (${metrics.change24h.toFixed(2)}%) flat / insufficient volatility.`
    };
  }
  return { isQualified: true };
}

/**
 * Builds the complete 10 Categories Scanner Model:
 * Each category contains 16 assets sorted by maximum 24h absolute changes.
 */
export function buildInitialCategoriesState(): CategorySummary[] {
  return CATEGORIES_CONFIG.map((catConfig) => {
    const rawAssetSymbols = [...catConfig.primarySymbols];
    const candidatePool = [...catConfig.candidatePool];

    const assets: AssetScanningState[] = [];

    for (const sym of rawAssetSymbols) {
      const metric = LIVE_REFERENCE_METRICS[sym] || {
        price: 10.0,
        change24h: 3.5,
        volume24h: 25000000
      };

      const candles = getCandlesForSymbol(sym);
      const currentPrice = candles[candles.length - 1].close;
      const qual = checkAssetQualification(metric);

      const pmax = calculatePMax(candles, 10, 3.0, 10);
      const proScalper = calculateProScalperAI(candles);
      const lastPMax = pmax[pmax.length - 1] || { dir: 1, mAvg: currentPrice, pMax: currentPrice * 0.98, buySignal: false, sellSignal: false };
      const lastScalper = proScalper[proScalper.length - 1] || { oscillator: 15, isAboveZero: true, isBelowZero: false };
      const swings = getRecentSwingLevels(candles, 5);

      // Initialize to NEUTRAL; real signals populate once live Binance 5m klines are fetched
      const signalStatus: AssetScanningState['signalStatus'] = 'NEUTRAL';

      assets.push({
        symbol: sym,
        category: catConfig.id,
        currentPrice,
        change24h: metric.change24h,
        volume24h: metric.volume24h,
        high24h: currentPrice * (1 + Math.abs(metric.change24h) / 200),
        low24h: currentPrice * (1 - Math.abs(metric.change24h) / 200),
        isQualified: qual.isQualified,
        disqualificationReason: qual.reason,
        pmaxDir: lastPMax.dir as (1 | -1),
        pmaxMAvg: lastPMax.mAvg,
        pmaxLine: lastPMax.pMax,
        pmaxSignal: lastPMax.buySignal ? 'BUY' : lastPMax.sellSignal ? 'SELL' : 'HOLD',
        proScalperOsc: lastScalper.oscillator,
        proScalperConfirmed: false,
        signalStatus,
        swingLow: swings.swingLow,
        swingHigh: swings.swingHigh,
        recentPnlPercent: 0
      });
    }

    // Dynamic Qualification check & Replacement
    for (let i = 0; i < assets.length; i++) {
      if (!assets[i].isQualified && candidatePool.length > 0) {
        const replacementSym = candidatePool.shift()!;
        const metric = LIVE_REFERENCE_METRICS[replacementSym] || {
          price: 2.5,
          change24h: 5.0,
          volume24h: 35000000
        };
        const candles = getCandlesForSymbol(replacementSym);
        const currentPrice = candles[candles.length - 1].close;
        const pmax = calculatePMax(candles, 10, 3.0, 10);
        const proScalper = calculateProScalperAI(candles);
        const swings = getRecentSwingLevels(candles, 5);
        const lastScalper = proScalper[proScalper.length - 1];

        assets[i] = {
          symbol: replacementSym,
          category: catConfig.id,
          currentPrice,
          change24h: metric.change24h,
          volume24h: metric.volume24h,
          high24h: currentPrice * 1.05,
          low24h: currentPrice * 0.95,
          isQualified: true,
          pmaxDir: pmax[pmax.length - 1].dir,
          pmaxMAvg: pmax[pmax.length - 1].mAvg,
          pmaxLine: pmax[pmax.length - 1].pMax,
          pmaxSignal: 'HOLD',
          proScalperOsc: lastScalper.oscillator,
          proScalperConfirmed: lastScalper.isAboveZero,
          signalStatus: lastScalper.isAboveZero ? 'CONFIRMED_BUY' : 'NEUTRAL',
          swingLow: swings.swingLow,
          swingHigh: swings.swingHigh,
          recentPnlPercent: 0
        };
      }
    }

    // Sort 16 assets by absolute 24h change descending
    assets.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
    const final16 = assets.slice(0, 16);

    const avgChange = final16.reduce((acc, a) => acc + a.change24h, 0) / (final16.length || 1);
    const maxChange = final16.length > 0 ? Math.max(...final16.map(a => Math.abs(a.change24h))) : 0;

    return {
      id: catConfig.id,
      name: catConfig.name,
      description: catConfig.description,
      assets: final16,
      avgChange24h: avgChange,
      maxChange24h: maxChange,
      activeTradesCount: 0,
      totalCategoryNetPnl: 0,
      totalCategoryNetPnlPercent: 0,
      qualificationCriteria: {
        minVolume24h: 5000000,
        maxSpread: 0.15
      }
    };
  });
}
