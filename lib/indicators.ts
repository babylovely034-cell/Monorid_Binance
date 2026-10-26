/**
 * Monorid Proprietary Quantitative Trading Engine
 * Copyright (c) 2026 Trading Lifestyle Quant. All rights reserved.
 * Strictly proprietary and confidential.
 */

import { Candle, PMaxResult, ProScalperResult, CombinedSignal } from './types';

/**
 * Calculates Wilder's RMA (Running Moving Average)
 * rma[i] = alpha * x[i] + (1 - alpha) * rma[i-1], where alpha = 1 / length
 */
export function calculateRMA(values: number[], length: number): number[] {
  if (values.length === 0) return [];
  const alpha = 1 / length;
  const result: number[] = new Array(values.length);
  
  // Initial value is SMA of first 'length' items, or first item if shorter
  let sum = 0;
  const initCount = Math.min(length, values.length);
  for (let i = 0; i < initCount; i++) {
    sum += values[i];
  }
  let prev = sum / initCount;
  for (let i = 0; i < initCount; i++) {
    result[i] = prev;
  }
  
  for (let i = initCount; i < values.length; i++) {
    prev = alpha * values[i] + (1 - alpha) * prev;
    result[i] = prev;
  }
  return result;
}

/**
 * Calculates EMA (Exponential Moving Average)
 */
export function calculateEMA(values: number[], length: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (length + 1);
  const result: number[] = new Array(values.length);
  
  // Initial value is first item or SMA
  let prev = values[0];
  result[0] = prev;
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    result[i] = prev;
  }
  return result;
}

/**
 * Calculates SMA (Simple Moving Average)
 */
export function calculateSMA(values: number[], length: number): number[] {
  if (values.length === 0) return [];
  const result: number[] = new Array(values.length);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= length) {
      sum -= values[i - length];
      result[i] = sum / length;
    } else {
      result[i] = sum / (i + 1);
    }
  }
  return result;
}

/**
 * Calculates WMA (Weighted Moving Average)
 * wma = sum(weight * val) / sum(weight)
 */
export function calculateWMA(values: number[], length: number): number[] {
  if (values.length === 0) return [];
  const result: number[] = new Array(values.length);
  const denom = (length * (length + 1)) / 2;

  for (let i = 0; i < values.length; i++) {
    if (i < length - 1) {
      const curLen = i + 1;
      const curDenom = (curLen * (curLen + 1)) / 2;
      let sum = 0;
      for (let k = 0; k < curLen; k++) {
        sum += values[i - k] * (curLen - k);
      }
      result[i] = sum / curDenom;
    } else {
      let sum = 0;
      for (let k = 0; k < length; k++) {
        sum += values[i - k] * (length - k);
      }
      result[i] = sum / denom;
    }
  }
  return result;
}

/**
 * Calculates Hull Moving Average (HMA)
 * HMA = WMA(2 * WMA(n/2) - WMA(n), round(sqrt(n)))
 */
export function calculateHMA(values: number[], length: number = 21): number[] {
  if (values.length === 0) return [];
  const halfLength = Math.max(1, Math.floor(length / 2));
  const sqrtLength = Math.max(1, Math.round(Math.sqrt(length)));

  const wmaHalf = calculateWMA(values, halfLength);
  const wmaFull = calculateWMA(values, length);

  const diff: number[] = new Array(values.length);
  for (let i = 0; i < values.length; i++) {
    diff[i] = 2 * wmaHalf[i] - wmaFull[i];
  }

  return calculateWMA(diff, sqrtLength);
}

/**
 * Calculates rolling sample Standard Deviation
 */
export function calculateStdDev(values: number[], length: number): number[] {
  if (values.length === 0) return [];
  const result: number[] = new Array(values.length).fill(0);
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - length + 1);
    const count = i - start + 1;
    let sum = 0;
    for (let j = start; j <= i; j++) {
      sum += values[j];
    }
    const mean = sum / count;
    let varSum = 0;
    for (let j = start; j <= i; j++) {
      varSum += (values[j] - mean) ** 2;
    }
    result[i] = Math.sqrt(varSum / count);
  }
  return result;
}

/**
 * Calculates True Range series
 */
export function calculateTR(candles: Candle[]): number[] {
  const tr: number[] = new Array(candles.length);
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr[i] = candles[i].high - candles[i].low;
    } else {
      const prevClose = candles[i - 1].close;
      tr[i] = Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - prevClose),
        Math.abs(candles[i].low - prevClose)
      );
    }
  }
  return tr;
}

/**
 * Calculates RSI (Relative Strength Index) using RMA of gains/losses
 */
export function calculateRSI(closes: number[], length: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= length) return rsi;

  const gains: number[] = new Array(closes.length).fill(0);
  const losses: number[] = new Array(closes.length).fill(0);

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) {
      gains[i] = diff;
    } else {
      losses[i] = -diff;
    }
  }

  const avgGains = calculateRMA(gains, length);
  const avgLosses = calculateRMA(losses, length);

  for (let i = length; i < closes.length; i++) {
    const loss = avgLosses[i];
    if (loss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGains[i] / loss;
      rsi[i] = 100 - (100 / (1 + rs));
    }
  }
  return rsi;
}

/**
 * Profit Maximizer (PMax) Calculation
 * Exact implementation matching KivancOzbilgic Pine Script
 * - src = hl2 = (high + low) / 2
 * - atr length = periods (default 10)
 * - multiplier = 3.0
 * - moving average = EMA (length 10)
 */
export function calculatePMax(
  candles: Candle[],
  periods: number = 10,
  multiplier: number = 3.0,
  maLength: number = 10
): PMaxResult[] {
  const len = candles.length;
  if (len === 0) return [];

  const hl2 = candles.map(c => (c.high + c.low) / 2);
  const tr = calculateTR(candles);
  const atr = calculateRMA(tr, periods);
  const mAvg = calculateEMA(hl2, maLength);

  const results: PMaxResult[] = new Array(len);
  let dir: 1 | -1 = 1;
  let longStop = mAvg[0] - multiplier * atr[0];
  let shortStop = mAvg[0] + multiplier * atr[0];

  for (let i = 0; i < len; i++) {
    const currentMA = mAvg[i];
    const currentAtr = atr[i];

    let newLongStop = currentMA - multiplier * currentAtr;
    const prevLongStop = i > 0 ? results[i - 1].longStop : newLongStop;
    if (currentMA > prevLongStop) {
      newLongStop = Math.max(newLongStop, prevLongStop);
    }
    longStop = newLongStop;

    let newShortStop = currentMA + multiplier * currentAtr;
    const prevShortStop = i > 0 ? results[i - 1].shortStop : newShortStop;
    if (currentMA < prevShortStop) {
      newShortStop = Math.min(newShortStop, prevShortStop);
    }
    shortStop = newShortStop;

    const prevDir = i > 0 ? results[i - 1].dir : 1;
    if (prevDir === -1 && currentMA > prevShortStop) {
      dir = 1;
    } else if (prevDir === 1 && currentMA < prevLongStop) {
      dir = -1;
    } else {
      dir = prevDir;
    }

    const pMax = dir === 1 ? longStop : shortStop;

    let buySignal = false;
    let sellSignal = false;
    if (i > 0) {
      const prevMA = mAvg[i - 1];
      const prevPMax = results[i - 1].pMax;
      // crossover(MAvg, PMax)
      buySignal = prevMA <= prevPMax && currentMA > pMax;
      // crossunder(MAvg, PMax)
      sellSignal = prevMA >= prevPMax && currentMA < pMax;
    }

    results[i] = {
      mAvg: currentMA,
      pMax,
      dir,
      atr: currentAtr,
      longStop,
      shortStop,
      buySignal,
      sellSignal
    };
  }

  return results;
}

/**
 * Pro Scalper AI [BullByte] Calculation
 * Exact implementation matching the Pine Script v6:
 * - ADX & DI calculation (diLen=14, adxLen=14)
 * - Volatility: ATR(14) normalized
 * - Momentum: Stochastic RSI (Mode 1: len=12, k=3, d=3)
 * - OBV Volume: normalized lookback 50
 * - Dynamic weights: ATR and ADX factor
 * - Composite Oscillator (-100 to +100)
 * - Zero Line = 0.0
 */
export function calculateProScalperAI(
  candles: Candle[],
  options: {
    adxLen?: number;
    diLen?: number;
    atrLen?: number;
    stochRsiLen?: number;
    stochKLen?: number;
    volLookback?: number;
    wTrend?: number;
    wMomentum?: number;
    wVolatility?: number;
    wVolume?: number;
  } = {}
): ProScalperResult[] {
  const {
    adxLen = 14,
    diLen = 14,
    atrLen = 14,
    stochRsiLen = 12,
    stochKLen = 3,
    volLookback = 50,
    wTrend = 0.3,
    wMomentum = 0.3,
    wVolatility = 0.2,
    wVolume = 0.2
  } = options;

  const len = candles.length;
  if (len === 0) return [];

  const tr = calculateTR(candles);
  const trueRange = calculateRMA(tr, diLen);

  // 1. DI & ADX
  const plusDM: number[] = new Array(len).fill(0);
  const minusDM: number[] = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const down = candles[i - 1].low - candles[i].low;
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }

  const rmaPlusDM = calculateRMA(plusDM, diLen);
  const rmaMinusDM = calculateRMA(minusDM, diLen);

  const diPlus: number[] = new Array(len);
  const diMinus: number[] = new Array(len);
  const dxRaw: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const trVal = trueRange[i] || 1e-5;
    diPlus[i] = (100 * rmaPlusDM[i]) / trVal;
    diMinus[i] = (100 * rmaMinusDM[i]) / trVal;
    const sum = diPlus[i] + diMinus[i];
    const diff = Math.abs(diPlus[i] - diMinus[i]);
    dxRaw[i] = sum === 0 ? 0 : diff / sum;
  }

  const rmaDx = calculateRMA(dxRaw, adxLen);
  const adxVal = rmaDx.map(v => 100 * v);

  // 2. Volatility: ATR(14)
  const atrVal = calculateRMA(tr, atrLen);

  // 3. Momentum: Stoch RSI (Mode 1)
  const closes = candles.map(c => c.close);
  const rsiValues = calculateRSI(closes, stochRsiLen);
  const stochRaw: number[] = new Array(len).fill(0.5);

  for (let i = 0; i < len; i++) {
    const startIdx = Math.max(0, i - stochRsiLen + 1);
    let minRsi = Infinity;
    let maxRsi = -Infinity;
    for (let j = startIdx; j <= i; j++) {
      if (rsiValues[j] < minRsi) minRsi = rsiValues[j];
      if (rsiValues[j] > maxRsi) maxRsi = rsiValues[j];
    }
    const diff = maxRsi - minRsi;
    if (diff <= 1e-5) {
      stochRaw[i] = rsiValues[i] >= 50 ? 1.0 : 0.0;
    } else {
      stochRaw[i] = (rsiValues[i] - minRsi) / diff;
    }
  }
  const stochK = calculateSMA(stochRaw, stochKLen);
  const momentumVal = stochK.map(k => (k - 0.5) * 2);

  // 4. Volume (OBV)
  const obv: number[] = new Array(len);
  let curObv = 0;
  for (let i = 0; i < len; i++) {
    if (i === 0) {
      curObv = candles[i].volume;
    } else {
      if (candles[i].close > candles[i - 1].close) {
        curObv += candles[i].volume;
      } else if (candles[i].close < candles[i - 1].close) {
        curObv -= candles[i].volume;
      }
    }
    obv[i] = curObv;
  }

  // 5. HMA(21) for confirmed trend direction
  const hmaValues = calculateHMA(closes, 21);

  // 6. Compute raw composite oscillator series
  const rawCompositeOsc: number[] = new Array(len);
  const trendDirList: number[] = new Array(len);
  const normTrendList: number[] = new Array(len);
  const normVolList: number[] = new Array(len);
  const normVolumeList: number[] = new Array(len);
  const weightsList: { wTrend: number; wVolatility: number; wMomentum: number; wVolume: number; total: number }[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const cClose = candles[i].close;
    // normTrend
    const trendDir = diPlus[i] > diMinus[i] ? 1.0 : diMinus[i] > diPlus[i] ? -1.0 : 0.0;
    trendDirList[i] = trendDir;
    const adxStrength = Math.min(Math.max((adxVal[i] - 20) / 20, 0.0), 1.0);
    const normTrend = trendDir * adxStrength;
    normTrendList[i] = normTrend;

    // normVolatility
    const normATR = atrVal[i] / cClose;
    const baseVol = 0.005;
    const normVolatility = Math.min(Math.max((normATR - baseVol) / baseVol, -1), 1);
    normVolList[i] = normVolatility;

    // normVolume over volLookback
    const startVol = Math.max(0, i - volLookback + 1);
    let minObv = Infinity;
    let maxObv = -Infinity;
    for (let j = startVol; j <= i; j++) {
      if (obv[j] < minObv) minObv = obv[j];
      if (obv[j] > maxObv) maxObv = obv[j];
    }
    const obvRange = Math.max(maxObv - minObv, 0.0001);
    const normVolume = Math.min(Math.max(((obv[i] - minObv) / obvRange) * 2 - 1, -1), 1);
    normVolumeList[i] = normVolume;

    // Dynamic Weighting
    const ratioVol = normATR / baseVol;
    const volFactor = Math.min(ratioVol, 2.0);

    const baseAdx = 25.0;
    const ratioAdx = adxVal[i] / baseAdx;
    const trendFactor = Math.min(ratioAdx, 1.5);

    const effWTrend = wTrend * trendFactor;
    const effWVolatility = wVolatility * volFactor;
    const effWMomentum = wMomentum;
    const effWVolume = wVolume;
    const totalWeight = effWTrend + effWVolatility + effWMomentum + effWVolume;
    weightsList[i] = { wTrend: effWTrend, wVolatility: effWVolatility, wMomentum: effWMomentum, wVolume: effWVolume, total: totalWeight };

    const oscRaw = (
      effWTrend * normTrend +
      effWMomentum * momentumVal[i] +
      effWVolatility * normVolatility +
      effWVolume * normVolume
    ) / (totalWeight || 1);

    rawCompositeOsc[i] = Math.min(Math.max(oscRaw * 100, -100), 100);
  }

  // 7. Dynamic multiplier based on rolling 50-bar StdDev of oscillator
  const stdDevOsc = calculateStdDev(rawCompositeOsc, 50);

  // 8. Assemble results with state machine / latching mode
  const results: ProScalperResult[] = new Array(len);
  let latchedState: 1 | -1 | 0 = 0;

  for (let i = 0; i < len; i++) {
    const compositeOsc = rawCompositeOsc[i];
    const dynMult = 0.5 * stdDevOsc[i];
    const upperThreshold = 25.0 + dynMult;
    const lowerThreshold = -25.0 - dynMult;

    // HMA(21) slope: 1 if rising, -1 if falling, 0 if flat
    const trendHMA = i > 0
      ? (hmaValues[i] > hmaValues[i - 1] ? 1 : hmaValues[i] < hmaValues[i - 1] ? -1 : 0)
      : (trendDirList[i]);

    // Confirmation conditions matching BullByte specification
    const condStrongBuy = compositeOsc > upperThreshold && trendHMA > 0 && adxVal[i] > 20;
    const condStrongSell = compositeOsc < lowerThreshold && trendHMA < 0 && adxVal[i] > 20;

    // State machine latching
    if (condStrongBuy) {
      latchedState = 1;
    } else if (condStrongSell) {
      latchedState = -1;
    } else if ((latchedState === 1 && compositeOsc < 0) || (latchedState === -1 && compositeOsc > 0)) {
      latchedState = 0; // reset on zero-line breach
    }

    let signalState: ProScalperResult['signalState'] = 'No Signal';
    if (condStrongBuy) {
      signalState = 'Strong Buy';
    } else if (condStrongSell) {
      signalState = 'Strong Sell';
    } else if (compositeOsc > 12.5 && trendHMA >= 0) {
      signalState = 'Early Buy';
    } else if (compositeOsc < -12.5 && trendHMA <= 0) {
      signalState = 'Early Sell';
    }

    results[i] = {
      adx: adxVal[i],
      diPlus: diPlus[i],
      diMinus: diMinus[i],
      normTrend: normTrendList[i],
      normVolatility: normVolList[i],
      momentum: momentumVal[i],
      normVolume: normVolumeList[i],
      dynamicWeights: weightsList[i],
      oscillator: compositeOsc,
      upperThreshold,
      lowerThreshold,
      trendHMA,
      hmaValue: hmaValues[i],
      condStrongBuy,
      condStrongSell,
      latchedState,
      isAboveZero: compositeOsc > 0,
      isBelowZero: compositeOsc < 0,
      signalState
    };
  }

  return results;
}

/**
 * Swing Low & Swing High calculation on recent closed candles
 */
export function getRecentSwingLevels(
  candles: Candle[],
  lookback: number = 5
): { swingLow: number; swingHigh: number } {
  if (candles.length === 0) return { swingLow: 0, swingHigh: 0 };
  const slice = candles.slice(-Math.min(lookback, candles.length));
  let swingLow = Infinity;
  let swingHigh = -Infinity;
  for (const c of slice) {
    if (c.low < swingLow) swingLow = c.low;
    if (c.high > swingHigh) swingHigh = c.high;
  }
  return { swingLow, swingHigh };
}

/**
 * Evaluates the User's Exact Strategy Combination:
 * - When profit maximizer pmax gives BUY signal,
 *   confirmation requires Pro Scalper AI [BullByte] composite oscillator ABOVE ZERO LINE (> 0).
 * - When profit maximizer pmax gives SELL signal,
 *   confirmation requires Pro Scalper AI [BullByte] composite oscillator BELOW ZERO LINE (< 0).
 * - "No confirmation no trade."
 * - Stop loss = recent swing low for longs, recent swing high for shorts.
 * - 1:2 Risk to Reward for all open positions.
 */
export function evaluateMonoridSignal(
  symbol: string,
  candles: Candle[],
  pmaxPeriods: number = 10,
  pmaxMultiplier: number = 3.0,
  swingLookback: number = 5
): CombinedSignal {
  if (candles.length < 20) {
    return {
      symbol,
      timestamp: Date.now(),
      pmaxSignal: 'NONE',
      proScalperOsc: 0,
      proScalperConfirmed: false,
      finalDecision: 'NO_TRADE',
      reason: 'Insufficient candle data for 5m strategy confirmation',
      price: candles[candles.length - 1]?.close || 0,
      swingLow: 0,
      swingHigh: 0,
      suggestedSL: 0,
      suggestedTP: 0,
      riskRewardRatio: 2.0
    };
  }

  const pmaxResults = calculatePMax(candles, pmaxPeriods, pmaxMultiplier, 10);
  const proScalperResults = calculateProScalperAI(candles);

  const lastIdx = candles.length - 1;
  const currentCandle = candles[lastIdx];
  const currentPrice = currentCandle.close;
  const pmaxLast = pmaxResults[lastIdx];
  const proScalperLast = proScalperResults[lastIdx];

  const { swingLow, swingHigh } = getRecentSwingLevels(candles, swingLookback);

  let pmaxSignal: 'BUY' | 'SELL' | 'NONE' = 'NONE';
  const isCrossoverBuy = pmaxLast.buySignal;
  const isCrossoverSell = pmaxLast.sellSignal;
  const isPMaxBull = pmaxLast.dir === 1 || pmaxLast.mAvg > pmaxLast.pMax || isCrossoverBuy;
  const isPMaxBear = pmaxLast.dir === -1 || pmaxLast.mAvg < pmaxLast.pMax || isCrossoverSell;

  if (isPMaxBull) pmaxSignal = 'BUY';
  else if (isPMaxBear) pmaxSignal = 'SELL';

  let finalDecision: 'EXECUTE_LONG' | 'EXECUTE_SHORT' | 'NO_TRADE' = 'NO_TRADE';
  let proScalperConfirmed = false;
  let isStrong = false;
  const isCrossover = isCrossoverBuy || isCrossoverSell;
  let reason = '';
  let suggestedSL = 0;
  let suggestedTP = 0;

  if (pmaxSignal === 'BUY') {
    // Confirmation: Pro Scalper AI (Strong Buy, latched Buy, or composite oscillator > 0)
    const isBullConfirmed = proScalperLast.condStrongBuy ||
      proScalperLast.latchedState === 1 ||
      (proScalperLast.oscillator > 0 && proScalperLast.trendHMA >= 0) ||
      proScalperLast.oscillator > 0;

    if (isBullConfirmed) {
      proScalperConfirmed = true;
      isStrong = proScalperLast.condStrongBuy;
      finalDecision = 'EXECUTE_LONG';
      // Stop loss = recent swing low
      // Buffer slightly below swing low (e.g. 0.05% or at least 1 tick)
      suggestedSL = Math.min(swingLow, currentPrice * 0.998);
      const risk = currentPrice - suggestedSL;
      if (risk <= 0) {
        suggestedSL = currentPrice * 0.99;
      }
      // 1:2 Risk to Reward
      suggestedTP = currentPrice + 2 * (currentPrice - suggestedSL);
      reason = `Trend BUY (${isCrossoverBuy ? 'crossover' : 'MAvg > Trailing Stop'}) confirmed by Composite Osc (${proScalperLast.condStrongBuy ? 'Strong Buy' : `Osc +${proScalperLast.oscillator.toFixed(1)} > 0`}). SL @ Swing Low ($${suggestedSL.toFixed(4)}), TP 1:2 RR ($${suggestedTP.toFixed(4)})`;
    } else {
      proScalperConfirmed = false;
      finalDecision = 'NO_TRADE';
      reason = `Trend BUY active, but REJECTED: Composite Osc is not bullish (${proScalperLast.oscillator.toFixed(1)} <= 0). No confirmation no trade.`;
    }
  } else if (pmaxSignal === 'SELL') {
    // Confirmation: Pro Scalper AI (Strong Sell, latched Sell, or composite oscillator < 0)
    const isBearConfirmed = proScalperLast.condStrongSell ||
      proScalperLast.latchedState === -1 ||
      (proScalperLast.oscillator < 0 && proScalperLast.trendHMA <= 0) ||
      proScalperLast.oscillator < 0;

    if (isBearConfirmed) {
      proScalperConfirmed = true;
      isStrong = proScalperLast.condStrongSell;
      finalDecision = 'EXECUTE_SHORT';
      // Stop loss = recent swing high
      suggestedSL = Math.max(swingHigh, currentPrice * 1.002);
      const risk = suggestedSL - currentPrice;
      if (risk <= 0) {
        suggestedSL = currentPrice * 1.01;
      }
      // 1:2 Risk to Reward
      suggestedTP = currentPrice - 2 * (suggestedSL - currentPrice);
      reason = `Trend SELL (${isCrossoverSell ? 'crossunder' : 'MAvg < Trailing Stop'}) confirmed by Composite Osc (${proScalperLast.condStrongSell ? 'Strong Sell' : `Osc ${proScalperLast.oscillator.toFixed(1)} < 0`}). SL @ Swing High ($${suggestedSL.toFixed(4)}), TP 1:2 RR ($${suggestedTP.toFixed(4)})`;
    } else {
      proScalperConfirmed = false;
      finalDecision = 'NO_TRADE';
      reason = `Trend SELL active, but REJECTED: Composite Osc is not bearish (${proScalperLast.oscillator.toFixed(1)} >= 0). No confirmation no trade.`;
    }
  } else {
    reason = `Scanning: Trend in neutral band. Composite Osc: ${proScalperLast.oscillator.toFixed(1)}`;
  }

  return {
    symbol,
    timestamp: currentCandle.timestamp,
    pmaxSignal,
    proScalperOsc: proScalperLast.oscillator,
    proScalperConfirmed,
    isStrong,
    isCrossover,
    finalDecision,
    reason,
    price: currentPrice,
    swingLow,
    swingHigh,
    suggestedSL,
    suggestedTP,
    riskRewardRatio: 2.0
  };
}

/**
 * Calculates Closed Trade PnL after Binance Platform Fees
 * - Entry fee = entryPrice * quantity * feeRate
 * - Exit fee = exitPrice * quantity * feeRate
 * - Gross PnL:
 *     Long: (exitPrice - entryPrice) * quantity
 *     Short: (entryPrice - exitPrice) * quantity
 * - Net PnL = Gross PnL - (Entry Fee + Exit Fee)
 * - Net ROI % = Net PnL / initialMargin * 100
 */
export function calculateClosedTradePnL(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  leverage: number,
  takerFeeRate: number = 0.0005 // 0.05% standard Binance USDT-M taker fee
): {
  grossPnl: number;
  entryFee: number;
  exitFee: number;
  totalFeesPaid: number;
  netPnl: number;
  netPnlPercent: number;
  initialMargin: number;
} {
  const notionalEntry = entryPrice * quantity;
  const notionalExit = exitPrice * quantity;
  const initialMargin = notionalEntry / leverage;

  const grossPnl = side === 'LONG'
    ? (exitPrice - entryPrice) * quantity
    : (entryPrice - exitPrice) * quantity;

  const entryFee = notionalEntry * takerFeeRate;
  const exitFee = notionalExit * takerFeeRate;
  const totalFeesPaid = entryFee + exitFee;
  const netPnl = grossPnl - totalFeesPaid;
  const netPnlPercent = initialMargin > 0 ? (netPnl / initialMargin) * 100 : 0;

  return {
    grossPnl,
    entryFee,
    exitFee,
    totalFeesPaid,
    netPnl,
    netPnlPercent,
    initialMargin
  };
}

/**
 * Calculates Estimated Binance USDT-M Futures Liquidation Price
 * For Isolated Positions:
 * Long: Entry * (1 - (1 / leverage) + MMR)
 * Short: Entry * (1 + (1 / leverage) - MMR)
 */
export function calculateLiquidationPrice(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  leverage: number,
  maintenanceMarginRate: number = 0.005 // 0.5% standard Tier 1 MMR on Binance
): number {
  if (side === 'LONG') {
    return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
  } else {
    return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
  }
}

/**
 * Checks if the proposed Stop Loss is over/past the liquidation level.
 * "if any trade sl over my Liquidation level avoid that trade."
 * Long: If SL <= Liquidation Price, position liquidates before SL -> REJECT.
 * Short: If SL >= Liquidation Price, position liquidates before SL -> REJECT.
 */
export function isStopLossOverLiquidation(
  side: 'LONG' | 'SHORT',
  stopLoss: number,
  liquidationPrice: number
): { isOver: boolean; reason?: string } {
  if (side === 'LONG') {
    if (stopLoss <= liquidationPrice) {
      return {
        isOver: true,
        reason: `Avoided trade: Long Stop Loss ($${stopLoss.toFixed(4)}) is at or below liquidation price ($${liquidationPrice.toFixed(4)}). Position would liquidate before hitting SL.`
      };
    }
  } else {
    if (stopLoss >= liquidationPrice) {
      return {
        isOver: true,
        reason: `Avoided trade: Short Stop Loss ($${stopLoss.toFixed(4)}) is at or above liquidation price ($${liquidationPrice.toFixed(4)}). Position would liquidate before hitting SL.`
      };
    }
  }
  return { isOver: false };
}

/**
 * Evaluates Signal Strength to assign dynamic leverage:
 * - "Best signal use 15x or good signal use 10x leverage."
 * Best signal:
 *   Long: Osc > 20.0 and ADX > 22
 *   Short: Osc < -20.0 and ADX > 22
 * Good signal:
 *   Standard confirmed signal (Long: Osc > 0, Short: Osc < 0)
 */
export function evaluateSignalStrength(
  side: 'LONG' | 'SHORT',
  oscillator: number,
  adx: number = 25,
  condStrong: boolean = false
): { strength: 'BEST' | 'GOOD'; leverage: 15 | 10 } {
  if (side === 'LONG') {
    if (condStrong || (oscillator >= 20.0 && adx >= 22)) {
      return { strength: 'BEST', leverage: 15 };
    }
    return { strength: 'GOOD', leverage: 10 };
  } else {
    if (condStrong || (oscillator <= -20.0 && adx >= 22)) {
      return { strength: 'BEST', leverage: 15 };
    }
    return { strength: 'GOOD', leverage: 10 };
  }
}

/**
 * Evaluates available trading balance respecting the $1.20 minimum reserve:
 * - "Keep 1.20$ balance in my account if our balance below 1.20$ no trade executed. Waiting for balance available"
 * - "Our all trade executed our balance 10% with 10x to 15x leverage based on our signal strength"
 */
export function calculateTradeMarginAllocation(
  currentBalance: number,
  riskPercent: number = 0.10, // 10% of balance
  minimumReserve: number = 1.20
): { canTrade: boolean; margin: number; reason?: string } {
  if (currentBalance <= minimumReserve) {
    return {
      canTrade: false,
      margin: 0,
      reason: `Balance ($${currentBalance.toFixed(2)}) is below the required $${minimumReserve.toFixed(2)} reserve buffer. Waiting for balance available.`
    };
  }

  const availableTradingBalance = currentBalance - minimumReserve;
  if (availableTradingBalance < 0.20) {
    return {
      canTrade: false,
      margin: 0,
      reason: `Usable trading balance ($${availableTradingBalance.toFixed(2)}) is insufficient after keeping $${minimumReserve.toFixed(2)} buffer. Waiting for balance available.`
    };
  }

  // 10% of current balance, but never exceeding usable funds beyond the $1.20 buffer
  const desiredMargin = currentBalance * riskPercent;
  const margin = Math.min(desiredMargin, availableTradingBalance);

  return {
    canTrade: true,
    margin
  };
}

