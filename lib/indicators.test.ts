import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePMax,
  calculateProScalperAI,
  getRecentSwingLevels,
  evaluateMonoridSignal,
  calculateClosedTradePnL,
  calculateTR,
  calculateEMA
} from './indicators';
import { Candle } from './types';

// Helper to generate synthetic test candles
function generateTrendCandles(count: number, startPrice: number, trend: 'up' | 'down' | 'flat'): Candle[] {
  const candles: Candle[] = [];
  let price = startPrice;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const change = trend === 'up' ? 0.8 : trend === 'down' ? -0.8 : 0;
    const noise = Math.sin(i) * 0.2;
    const open = price;
    const close = price + change + noise;
    const high = Math.max(open, close) + 0.5;
    const low = Math.min(open, close) - 0.5;
    const volume = 1000 + Math.abs(change) * 200;

    candles.push({
      timestamp: now + i * 300000, // 5m intervals
      open,
      high,
      low,
      close,
      volume
    });
    price = close;
  }
  return candles;
}

test('calculateTR calculates correct True Range', () => {
  const candles: Candle[] = [
    { timestamp: 1, open: 100, high: 105, low: 95, close: 102, volume: 10 },
    { timestamp: 2, open: 102, high: 110, low: 101, close: 108, volume: 15 },
  ];
  const tr = calculateTR(candles);
  assert.equal(tr[0], 10); // 105 - 95
  assert.equal(tr[1], 110 - 101); // 9 vs abs(110-102)=8 vs abs(101-102)=1 => 9
});

test('calculatePMax generates valid trailing stops and directions', () => {
  const upCandles = generateTrendCandles(30, 100, 'up');
  const results = calculatePMax(upCandles, 10, 3.0, 10);

  assert.equal(results.length, 30);
  const last = results[results.length - 1];
  assert.ok(last.mAvg > 0);
  assert.ok(last.pMax > 0);
  assert.equal(last.dir, 1, 'In strong uptrend dir should be 1 (bullish)');
});

test('calculateProScalperAI generates composite oscillator within bounds', () => {
  const candles = generateTrendCandles(40, 100, 'up');
  const results = calculateProScalperAI(candles);

  assert.equal(results.length, 40);
  const last = results[results.length - 1];
  assert.ok(last.oscillator >= -100 && last.oscillator <= 100, 'Oscillator must be in [-100, 100]');
  assert.ok(typeof last.isAboveZero === 'boolean');
  assert.ok(typeof last.isBelowZero === 'boolean');
  assert.ok(last.isAboveZero === (last.oscillator > 0));
});

test('evaluateMonoridSignal: No confirmation no trade rule', () => {
  // Test 1: Empty or short history returns NO_TRADE
  const shortCandles = generateTrendCandles(5, 100, 'flat');
  const signalShort = evaluateMonoridSignal('BTCUSDT', shortCandles);
  assert.equal(signalShort.finalDecision, 'NO_TRADE');

  // Test 2: Verify swing levels calculation
  const testCandles = generateTrendCandles(25, 100, 'up');
  const swings = getRecentSwingLevels(testCandles, 5);
  assert.ok(swings.swingLow > 0);
  assert.ok(swings.swingHigh >= swings.swingLow);
});

test('Risk/Reward 1:2 and Stop Loss calculations', () => {
  const entryPrice = 50000;
  const swingLow = 49000;
  const swingHigh = 51000;

  // Long check: SL = swingLow (49000), Risk = 1000, TP = 50000 + 2 * 1000 = 52000
  const longRisk = entryPrice - swingLow;
  const longTP = entryPrice + 2 * longRisk;
  assert.equal(longTP, 52000);
  assert.equal((longTP - entryPrice) / longRisk, 2.0);

  // Short check: SL = swingHigh (51000), Risk = 1000, TP = 50000 - 2 * 1000 = 48000
  const shortRisk = swingHigh - entryPrice;
  const shortTP = entryPrice - 2 * shortRisk;
  assert.equal(shortTP, 48000);
  assert.equal((entryPrice - shortTP) / shortRisk, 2.0);
});

test('calculateClosedTradePnL accurately deducts Binance platform fees', () => {
  const entryPrice = 100;
  const exitPrice = 110;
  const quantity = 10; // Notional entry = 1000, notional exit = 1100
  const leverage = 10; // Margin = 100
  const takerFeeRate = 0.0005; // 0.05%

  const result = calculateClosedTradePnL('LONG', entryPrice, exitPrice, quantity, leverage, takerFeeRate);

  // Gross PnL: (110 - 100) * 10 = +$100
  assert.equal(result.grossPnl, 100);

  // Entry fee: 1000 * 0.0005 = 0.50
  assert.equal(result.entryFee, 0.50);

  // Exit fee: 1100 * 0.0005 = 0.55
  assert.equal(result.exitFee, 0.55);

  // Total fees paid: 0.50 + 0.55 = 1.05
  assert.equal(result.totalFeesPaid, 1.05);

  // Net PnL: 100 - 1.05 = 98.95
  assert.equal(result.netPnl, 98.95);

  // Initial Margin: 1000 / 10 = 100
  assert.equal(result.initialMargin, 100);

  // Net ROI %: (98.95 / 100) * 100 = 98.95%
  assert.equal(result.netPnlPercent, 98.95);
});

test('calculateLiquidationPrice and isStopLossOverLiquidation avoid liquidating trades', () => {
  const { calculateLiquidationPrice, isStopLossOverLiquidation } = require('./indicators');
  
  // Long with 10x leverage
  const longLiq = calculateLiquidationPrice('LONG', 100, 10);
  assert.ok(longLiq > 89 && longLiq < 92, `Expected liq ~90.5, got ${longLiq}`);

  // Safe SL ($95 > Liq $90.5)
  const safeCheck = isStopLossOverLiquidation('LONG', 95, longLiq);
  assert.equal(safeCheck.isOver, false);

  // Dangerous SL ($88 <= Liq $90.5) -> MUST AVOID TRADE
  const dangerCheck = isStopLossOverLiquidation('LONG', 88, longLiq);
  assert.equal(dangerCheck.isOver, true);
  assert.ok(dangerCheck.reason?.includes('Avoided trade'));

  // Short with 15x leverage
  const shortLiq = calculateLiquidationPrice('SHORT', 100, 15);
  assert.ok(shortLiq > 105 && shortLiq < 108);

  // Safe Short SL ($104 < Liq $106.1)
  assert.equal(isStopLossOverLiquidation('SHORT', 104, shortLiq).isOver, false);

  // Dangerous Short SL ($108 >= Liq $106.1) -> MUST AVOID TRADE
  assert.equal(isStopLossOverLiquidation('SHORT', 108, shortLiq).isOver, true);
});

test('evaluateSignalStrength assigns 15x for BEST and 10x for GOOD', () => {
  const { evaluateSignalStrength } = require('./indicators');

  const bestLong = evaluateSignalStrength('LONG', 32, 28);
  assert.equal(bestLong.strength, 'BEST');
  assert.equal(bestLong.leverage, 15);

  const goodLong = evaluateSignalStrength('LONG', 12, 18);
  assert.equal(goodLong.strength, 'GOOD');
  assert.equal(goodLong.leverage, 10);

  const bestShort = evaluateSignalStrength('SHORT', -35, 30);
  assert.equal(bestShort.strength, 'BEST');
  assert.equal(bestShort.leverage, 15);

  const goodShort = evaluateSignalStrength('SHORT', -8, 19);
  assert.equal(goodShort.strength, 'GOOD');
  assert.equal(goodShort.leverage, 10);
});

test('calculateTradeMarginAllocation enforces $1.20 buffer and 10% sizing', () => {
  const { calculateTradeMarginAllocation } = require('./indicators');

  // Below $1.20 -> no trade, waiting for balance
  const belowReserve = calculateTradeMarginAllocation(1.10, 0.10, 1.20);
  assert.equal(belowReserve.canTrade, false);
  assert.ok(belowReserve.reason?.includes('Waiting for balance available'));

  // Exactly $1.20 -> no trade
  const atReserve = calculateTradeMarginAllocation(1.20, 0.10, 1.20);
  assert.equal(atReserve.canTrade, false);

  // Standard balance: $100 -> 10% = $10 margin
  const standard = calculateTradeMarginAllocation(100.0, 0.10, 1.20);
  assert.equal(standard.canTrade, true);
  assert.equal(standard.margin, 10.0);
});

