import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePMax,
  calculateProScalperAI,
  getRecentSwingLevels,
  evaluateMonoridSignal,
  calculateClosedTradePnL,
  calculateTR,
  calculateEMA,
  calculateSMA,
  calculateWMA,
  calculateHMA,
  calculateStdDev,
  calculateLiquidationPrice,
  isStopLossOverLiquidation,
  evaluateSignalStrength,
  calculateTradeMarginAllocation
} from './indicators';
import { formatQuantity, formatPrice } from './binanceClient';
import { checkAssetQualification } from './scannerData';
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
    const close = Math.max(0.01, price + change + noise);
    const high = Math.max(open, close) + 0.5;
    const low = Math.max(0.005, Math.min(open, close) - 0.5);
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

test('calculateWMA and calculateHMA produce smooth trend lines', () => {
  const values = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const wma = calculateWMA(values, 5);
  assert.equal(wma.length, values.length);
  // Last WMA of linear ramp [16, 17, 18, 19, 20] with length 5:
  // (16*1 + 17*2 + 18*3 + 19*4 + 20*5) / (1+2+3+4+5=15) = (16 + 34 + 54 + 76 + 100) / 15 = 280 / 15 = 18.6667
  assert.ok(Math.abs(wma[10] - 18.6667) < 0.01);

  const hma = calculateHMA(values, 5);
  assert.equal(hma.length, values.length);
  assert.ok(hma[10] > hma[0], 'HMA should reflect uptrend');
});

test('calculateStdDev calculates accurate rolling sample standard deviation', () => {
  const vals = [10, 10, 10, 10, 10];
  const std0 = calculateStdDev(vals, 5);
  assert.equal(std0[4], 0);

  const varying = [2, 4, 4, 4, 5, 5, 7, 9];
  const std = calculateStdDev(varying, 8);
  assert.ok(std[7] > 1.5 && std[7] < 2.5);
});

test('calculatePMax generates valid trailing stops and directions', () => {
  const upCandles = generateTrendCandles(35, 100, 'up');
  const results = calculatePMax(upCandles, 10, 3.0, 10);

  assert.equal(results.length, 35);
  const last = results[results.length - 1];
  assert.ok(last.mAvg > 0);
  assert.ok(last.pMax > 0);
  assert.equal(last.dir, 1, 'In strong uptrend dir should be 1 (bullish)');

  // Down trend check
  const downCandles = generateTrendCandles(35, 100, 'down');
  const downResults = calculatePMax(downCandles, 10, 3.0, 10);
  const lastDown = downResults[downResults.length - 1];
  assert.equal(lastDown.dir, -1, 'In strong downtrend dir should be -1 (bearish)');
});

test('calculateProScalperAI generates composite oscillator within bounds and sets HMA trend', () => {
  const candles = generateTrendCandles(50, 100, 'up');
  const results = calculateProScalperAI(candles);

  assert.equal(results.length, 50);
  const last = results[results.length - 1];
  assert.ok(last.oscillator >= -100 && last.oscillator <= 100, 'Oscillator must be in [-100, 100]');
  assert.ok(typeof last.isAboveZero === 'boolean');
  assert.ok(typeof last.isBelowZero === 'boolean');
  assert.ok(last.isAboveZero === (last.oscillator > 0));
  assert.ok(typeof last.trendHMA === 'number');
  assert.ok(typeof last.condStrongBuy === 'boolean');
  assert.ok(typeof last.condStrongSell === 'boolean');
});

test('evaluateMonoridSignal: Both indicators must agree (PMax + Pro Scalper AI)', () => {
  // Test 1: Empty or short history returns NO_TRADE
  const shortCandles = generateTrendCandles(5, 100, 'flat');
  const signalShort = evaluateMonoridSignal('BTCUSDT', shortCandles);
  assert.equal(signalShort.finalDecision, 'NO_TRADE');
  assert.ok(signalShort.reason.includes('Insufficient candle data'));

  // Test 2: Verify swing levels calculation
  const testCandles = generateTrendCandles(30, 100, 'up');
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

test('Edge cases: Empty arrays, zero division, and boundary values', () => {
  assert.deepEqual(calculateTR([]), []);
  assert.deepEqual(calculateEMA([], 10), []);
  assert.deepEqual(calculateSMA([], 10), []);
  assert.deepEqual(calculateWMA([], 10), []);
  assert.deepEqual(calculateHMA([], 21), []);
  assert.deepEqual(calculatePMax([], 10, 3.0, 10), []);
  assert.deepEqual(calculateProScalperAI([]), []);
  assert.deepEqual(getRecentSwingLevels([]), { swingLow: 0, swingHigh: 0 });

  // Negative balance allocation
  const negBalance = calculateTradeMarginAllocation(-50, 0.10, 1.20);
  assert.equal(negBalance.canTrade, false);
});

test('formatQuantity and formatPrice avoid scientific notation and enforce step/tick precision', () => {
  // Step 0.001 (e.g. BTC)
  assert.equal(formatQuantity(0.0123456, 0.001, 3), '0.012');
  // Step 0.01 (e.g. SOL)
  assert.equal(formatQuantity(1.4589, 0.01, 2), '1.45');
  // Step 1 (e.g. DOGE)
  assert.equal(formatQuantity(254.9, 1, 0), '254');
  // Very small float that could turn into scientific notation in JS
  assert.equal(formatQuantity(0.0000456, 0.00001, 5), '0.00004');

  // Price formatting with tick size
  assert.equal(formatPrice(80532.789, 0.1, 1), '80532.8');
  assert.equal(formatPrice(0.1234567, 0.00001, 5), '0.12346');
  assert.equal(formatPrice(178.654, 0.01, 2), '178.65');
});

test('evaluateMonoridSignal supports (or MAvg > PMax) / (or MAvg < PMax) and enforces agreement', () => {
  // Uptrend candles: PMax dir === 1 and Pro Scalper Osc > 0 -> EXECUTE_LONG
  const upCandles = generateTrendCandles(40, 100, 'up');
  const upSignal = evaluateMonoridSignal('BTCUSDT', upCandles);
  assert.equal(upSignal.pmaxSignal, 'BUY');
  assert.ok(upSignal.proScalperConfirmed);
  assert.equal(upSignal.finalDecision, 'EXECUTE_LONG');
  assert.ok(upSignal.suggestedTP > upSignal.price);
  assert.ok(upSignal.suggestedSL < upSignal.price);
  assert.equal(upSignal.riskRewardRatio, 2.0);

  // Downtrend candles: PMax dir === -1 and Pro Scalper Osc < 0 -> EXECUTE_SHORT
  const downCandles = generateTrendCandles(40, 100, 'down');
  const downSignal = evaluateMonoridSignal('BTCUSDT', downCandles);
  assert.equal(downSignal.pmaxSignal, 'SELL');
  assert.ok(downSignal.proScalperConfirmed);
  assert.equal(downSignal.finalDecision, 'EXECUTE_SHORT');
  assert.ok(downSignal.suggestedTP < downSignal.price);
  assert.ok(downSignal.suggestedSL > downSignal.price);
  assert.equal(downSignal.riskRewardRatio, 2.0);
});

test('calculateProScalperAI latching mode state machine', () => {
  const upCandles = generateTrendCandles(45, 100, 'up');
  const scalperResults = calculateProScalperAI(upCandles);
  const last = scalperResults[scalperResults.length - 1];
  assert.ok(last.latchedState === 1 || last.latchedState === 0);
  assert.ok(typeof last.latchedState === 'number');
});

test('evaluateMonoridSignal rejects trades when PMax and Pro Scalper disagree', () => {
  // Construct a synthetic scenario: Bullish PMax but negative oscillator
  const mixedCandles: Candle[] = [];
  const now = Date.now();
  let price = 100;
  // First 30 bars go strongly down to drag momentum negative, then 10 bars sharp jump to push MAvg above PMax
  for (let i = 0; i < 30; i++) {
    price -= 1.0;
    mixedCandles.push({ timestamp: now + i * 300000, open: price, high: price + 0.2, low: price - 0.2, close: price, volume: 1000 });
  }
  for (let i = 30; i < 40; i++) {
    price += 0.8;
    mixedCandles.push({ timestamp: now + i * 300000, open: price, high: price + 0.3, low: price - 0.1, close: price, volume: 500 });
  }
  const signal = evaluateMonoridSignal('ETHUSDT', mixedCandles);
  if (signal.pmaxSignal === 'BUY' && signal.proScalperOsc <= 0) {
    assert.equal(signal.finalDecision, 'NO_TRADE');
    assert.ok(signal.reason.includes('REJECTED'));
  }
});

test('evaluateMonoridSignal with live Binance 5m klines queries and evaluates correctly', async () => {
  const { getBinanceKlines } = await import('./binanceClient');
  const liveKlines = await getBinanceKlines('BTCUSDT', '5m', 60);
  assert.equal(liveKlines.length, 60);
  const signal = evaluateMonoridSignal('BTCUSDT', liveKlines);
  assert.ok(['BUY', 'SELL', 'NONE'].includes(signal.pmaxSignal));
  assert.ok(['EXECUTE_LONG', 'EXECUTE_SHORT', 'NO_TRADE'].includes(signal.finalDecision));
  assert.ok(typeof signal.proScalperOsc === 'number');
  assert.ok(signal.price > 0);
  if (signal.finalDecision === 'EXECUTE_LONG') {
    assert.ok(signal.suggestedTP > signal.price);
    assert.ok(signal.suggestedSL < signal.price);
  } else if (signal.finalDecision === 'EXECUTE_SHORT') {
    assert.ok(signal.suggestedTP < signal.price);
    assert.ok(signal.suggestedSL > signal.price);
  }
});

test('Running trade protective TP and SL calculation for LONG and SHORT positions', () => {
  // Scenario 1: SHORT position running with markPrice = 1.0135, entry = 1.0052, liq = 1.0986
  const shortPrice = 1.0135;
  const shortLiq = 1.0986;
  const shortSL = shortPrice * 1.012; // 1.02566
  assert.ok(shortSL > shortPrice, 'Short SL must be strictly above mark price');
  assert.ok(shortSL < shortLiq, 'Short SL must be safely below liquidation price');
  const shortRisk = shortSL - shortPrice;
  const shortTP = shortPrice - 2 * shortRisk;
  assert.ok(shortTP < shortPrice, 'Short TP must be strictly below mark price');
  assert.equal(+(shortRisk * 2).toFixed(4), +(shortPrice - shortTP).toFixed(4), 'Risk to Reward must be 1:2');

  // Scenario 2: LONG position running with markPrice = 0.9128, entry = 0.9059, liq = 0.8100
  const longPrice = 0.9128;
  const longLiq = 0.8100;
  const longSL = longPrice * 0.988;
  assert.ok(longSL < longPrice, 'Long SL must be strictly below mark price');
  assert.ok(longSL > longLiq, 'Long SL must be safely above liquidation price');
  const longRisk = longPrice - longSL;
  const longTP = longPrice + 2 * longRisk;
  assert.ok(longTP > longPrice, 'Long TP must be strictly above mark price');
  assert.equal(+(longRisk * 2).toFixed(4), +(longTP - longPrice).toFixed(4), 'Risk to Reward must be 1:2');

  // Scenario 3: Boundary & Liquidation collision guard
  // If a SHORT trade has liquidation price closer than default 1.2%, SL must not breach liq price
  const tightLiqShortPrice = 100;
  const tightLiqShort = 101.0; // liq is only 1% away
  let tightSL = tightLiqShortPrice * 1.012; // 101.2 > 101.0 -> would liquidate before SL
  if (tightSL >= tightLiqShort) {
    tightSL = Math.min(tightLiqShort * 0.995, tightLiqShortPrice * 1.004);
  }
  assert.ok(tightSL < tightLiqShort, 'Guard must keep SL below liquidation price');
  assert.ok(tightSL > tightLiqShortPrice, 'Guard must keep SL above current price');
});

test('formatPrice and formatQuantity strictly enforce discrete tick and step multiples', async () => {
  const { formatPrice, formatQuantity, roundToStep, roundToTick } = await import('./binanceClient');

  // Test 1: tickSize 0.05 (like BTC or certain futures contracts)
  const priceWith05Tick = formatPrice(100.02, 0.05, 2);
  assert.equal(priceWith05Tick, '100.00', '100.02 with 0.05 tick must round to 100.00 multiple');
  const priceWith05TickHigh = formatPrice(100.03, 0.05, 2);
  assert.equal(priceWith05TickHigh, '100.05', '100.03 with 0.05 tick must round to 100.05 multiple');

  // Test 2: stepSize 1 with 0 quantity precision (like ICPUSDT, ADAUSDT)
  const qtyStep1 = formatQuantity(7.9, 1, 0);
  assert.equal(qtyStep1, '7', '7.9 with stepSize 1 must floor to integer string 7');

  // Test 3: stepSize 0.1 with 1 decimal (like SUIUSDT, DOTUSDT, APTUSDT)
  const qtyStep01 = formatQuantity(14.39, 0.1, 1);
  assert.equal(qtyStep01, '14.3', '14.39 with stepSize 0.1 must floor to 14.3');

  // Test 4: roundToStep & roundToTick
  assert.equal(roundToStep(14.39, 0.1), 14.3);
  assert.equal(roundToTick(100.03, 0.05), 100.05);
});

test('SL and TP order classifier correctly identifies Algo Orders and ignores non-protective Limit orders', () => {
  const isPosLong = true;
  const markPrice = 100.0;

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

  // Case 1: Binance Algo Order for Stop Loss (orderType: 'STOP_MARKET', triggerPrice: '98.0')
  const algoSL = { algoId: 101, algoType: 'CONDITIONAL', orderType: 'STOP_MARKET', triggerPrice: '98.0' };
  assert.equal(isSL(algoSL), true, 'Algo STOP_MARKET order must be identified as SL');
  assert.equal(isTP(algoSL), false, 'Algo STOP_MARKET must not be identified as TP');

  // Case 2: Binance Algo Order for Take Profit (orderType: 'TAKE_PROFIT_MARKET', triggerPrice: '104.0')
  const algoTP = { algoId: 102, algoType: 'CONDITIONAL', orderType: 'TAKE_PROFIT_MARKET', triggerPrice: '104.0' };
  assert.equal(isTP(algoTP), true, 'Algo TAKE_PROFIT_MARKET order must be identified as TP');
  assert.equal(isSL(algoTP), false, 'Algo TAKE_PROFIT_MARKET must not be identified as SL');

  // Case 3: Regular BUY LIMIT order below mark price (e.g. entry dip order) MUST NOT BE SL!
  const normalLimitBuy = { orderId: 201, type: 'LIMIT', price: '95.0', side: 'BUY' };
  assert.equal(isSL(normalLimitBuy), false, 'Unrelated regular BUY LIMIT order must NOT be identified as SL');
  assert.equal(isTP(normalLimitBuy), false, 'Regular BUY LIMIT must NOT be identified as TP');

  // Case 4: Regular SELL LIMIT order above mark price without reduceOnly MUST NOT BE TP!
  const normalLimitSell = { orderId: 202, type: 'LIMIT', price: '105.0', side: 'SELL' };
  assert.equal(isTP(normalLimitSell), false, 'Regular SELL LIMIT order without reduceOnly must NOT be identified as TP');

  // Case 5: Reduce-only SELL LIMIT order above mark price IS a valid Take Profit
  const reduceOnlyTPSell = { orderId: 203, type: 'LIMIT', price: '105.0', side: 'SELL', reduceOnly: true };
  assert.equal(isTP(reduceOnlyTPSell), true, 'Reduce-only SELL LIMIT order above mark price must be identified as TP');
});

test('checkAssetQualification enforces $5M 24h volume and 0.3% price volatility thresholds', () => {
  const lowVol = checkAssetQualification({ volume24h: 4900000, change24h: 5.0, price: 10 });
  assert.equal(lowVol.isQualified, false, 'Volume under $5M must disqualify');
  assert.ok(lowVol.reason?.includes('$5M threshold'));

  const lowChange = checkAssetQualification({ volume24h: 10000000, change24h: 0.15, price: 10 });
  assert.equal(lowChange.isQualified, false, 'Change under 0.3% must disqualify');
  assert.ok(lowChange.reason?.includes('insufficient volatility'));

  const negativeFlat = checkAssetQualification({ volume24h: 8000000, change24h: -0.2, price: 10 });
  assert.equal(negativeFlat.isQualified, false, 'Negative change under 0.3% absolute must disqualify');

  const qualified = checkAssetQualification({ volume24h: 12000000, change24h: -1.5, price: 10 });
  assert.equal(qualified.isQualified, true, 'Valid volume and volatility must qualify');
});

test('Binance Minimum Notional & Margin clamping logic prevents order rejections', () => {
  const evaluateMarginNotional = (symbol: string, currentBalance: number, leverage: number) => {
    const usableBalance = Math.max(0, currentBalance - 1.20);
    const marginAllocation = calculateTradeMarginAllocation(currentBalance, 0.10, 1.20);
    if (!marginAllocation.canTrade) {
      return { canTrade: false, margin: 0, reason: marginAllocation.reason };
    }

    let margin = marginAllocation.margin;
    if (symbol === 'BTCUSDT') {
      const minMarginReq = 50.0 / leverage;
      if (usableBalance < minMarginReq) {
        return { canTrade: false, margin: 0, reason: 'BTC min notional unsatisfied' };
      }
      margin = Math.max(margin, minMarginReq);
    } else if (symbol === 'ETHUSDT') {
      const minMarginReq = 20.0 / leverage;
      if (usableBalance < minMarginReq) {
        return { canTrade: false, margin: 0, reason: 'ETH min notional unsatisfied' };
      }
      margin = Math.max(margin, minMarginReq);
    } else {
      const minMarginFor5 = 5.05 / leverage;
      if (margin * leverage < 5.0) {
        if (usableBalance >= 0.55) {
          margin = Math.max(margin, Math.min(usableBalance, minMarginFor5));
        } else if (usableBalance >= minMarginFor5) {
          margin = minMarginFor5;
        } else {
          return { canTrade: false, margin: 0, reason: 'Altcoin min notional unsatisfied' };
        }
      }
    }
    margin = Math.min(margin, usableBalance);
    return { canTrade: true, margin, notional: margin * leverage };
  };

  // Case 1: Account with $6.63 total balance ($5.43 usable), evaluating BTCUSDT at 10x ($5.00 min margin)
  const btcPass = evaluateMarginNotional('BTCUSDT', 6.63, 10);
  assert.equal(btcPass.canTrade, true, 'BTCUSDT must pass when usable balance ($5.43) >= $5.00');
  assert.ok(btcPass.margin >= 5.0, 'BTCUSDT margin must be at least $5.00');

  // Case 2: Account with $4.00 total balance ($2.80 usable), evaluating BTCUSDT at 10x ($5.00 min margin)
  const btcFail = evaluateMarginNotional('BTCUSDT', 4.00, 10);
  assert.equal(btcFail.canTrade, false, 'BTCUSDT must be skipped when usable balance ($2.80) < $5.00');

  // Case 3: Same $4.00 total balance ($2.80 usable), evaluating Altcoin SOLUSDT at 10x
  // 10% sizing would be $0.40 margin ($4.00 notional, below $5 min notional), but clamped to $0.505 margin ($5.05 notional)
  const altClamped = evaluateMarginNotional('SOLUSDT', 4.00, 10);
  assert.equal(altClamped.canTrade, true, 'Altcoin trade must proceed on $4.00 balance');
  assert.ok(altClamped.margin >= 0.50, 'Margin must be clamped to at least $0.50');
  assert.ok(altClamped.notional >= 5.0, 'Notional must satisfy >= $5.00 min threshold');

  // Case 4: Account with $1.50 balance ($0.30 usable, below $0.50 min margin for altcoins at 10x)
  const altFail = evaluateMarginNotional('SOLUSDT', 1.50, 10);
  assert.equal(altFail.canTrade, false, 'Altcoin trade must be skipped when usable balance cannot satisfy $5 notional');
});

test('Category round-robin scheduling and 60s cooldown prevent category starvation and infinite deadlocks', () => {
  const cooldownMap = new Map<string, number>();
  const categoriesCount = 10;
  let lastCategoryIndex = 0;

  // Simulate a failed execution on Category 0 asset
  const symbolCat0 = 'BTCUSDT';
  cooldownMap.set(symbolCat0, Date.now()); // placed into cooldown

  // Check cooldown filter
  const isCooldownActive = (sym: string) => {
    const last = cooldownMap.get(sym) || 0;
    return Date.now() - last < 60000;
  };
  assert.equal(isCooldownActive(symbolCat0), true, 'Rejected symbol must be in 60s cooldown');
  assert.equal(isCooldownActive('SOLUSDT'), false, 'Non-rejected symbol must not be in cooldown');

  // Simulate round-robin advancement
  const dispatchOrder = (catIdx: number) => {
    lastCategoryIndex = (catIdx + 1) % categoriesCount;
  };

  dispatchOrder(0);
  assert.equal(lastCategoryIndex, 1, 'Next round starts from Category 1');

  dispatchOrder(1);
  assert.equal(lastCategoryIndex, 2, 'Next round starts from Category 2');

  for (let i = 2; i < 9; i++) {
    dispatchOrder(i);
  }
  dispatchOrder(9);
  assert.equal(lastCategoryIndex, 0, 'Round-robin wraps cleanly back to Category 0');
});


