export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendDirection = 1 | -1 | 0;

export interface PMaxResult {
  mAvg: number;
  pMax: number;
  dir: 1 | -1;
  atr: number;
  longStop: number;
  shortStop: number;
  buySignal: boolean;
  sellSignal: boolean;
}

export interface ProScalperResult {
  adx: number;
  diPlus: number;
  diMinus: number;
  normTrend: number;
  normVolatility: number;
  momentum: number; // Stoch RSI normalized to -1..1
  normVolume: number;
  dynamicWeights: {
    wTrend: number;
    wVolatility: number;
    wMomentum: number;
    wVolume: number;
    total: number;
  };
  oscillator: number; // Composite oscillator (-100 to +100)
  upperThreshold: number;
  lowerThreshold: number;
  trendHMA: number;
  isAboveZero: boolean;
  isBelowZero: boolean;
  signalState: 'Strong Buy' | 'Strong Sell' | 'Early Buy' | 'Early Sell' | 'No Signal';
}

export interface CombinedSignal {
  symbol: string;
  timestamp: number;
  pmaxSignal: 'BUY' | 'SELL' | 'NONE';
  proScalperOsc: number;
  proScalperConfirmed: boolean;
  finalDecision: 'EXECUTE_LONG' | 'EXECUTE_SHORT' | 'NO_TRADE';
  reason: string;
  price: number;
  swingLow: number;
  swingHigh: number;
  suggestedSL: number;
  suggestedTP: number;
  riskRewardRatio: number;
}

export interface Position {
  id: string;
  symbol: string;
  category: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  markPrice: number;
  quantity: number;
  leverage: 10 | 15 | number;
  signalStrength: 'BEST' | 'GOOD';
  margin: number;
  entryTime: number;
  stopLoss: number;
  takeProfit: number;
  liquidationPrice: number;
  recentSwingPrice: number;
  grossPnl: number;
  feesPaid: number;
  netPnl: number;
  netPnlPercent: number;
  status: 'OPEN' | 'CLOSING';
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  category: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  leverage: number;
  signalStrength?: 'BEST' | 'GOOD';
  margin: number;
  entryTime: number;
  exitTime: number;
  grossPnl: number;
  entryFee: number;
  exitFee: number;
  totalFeesPaid: number;
  netPnl: number;
  netPnlPercent: number;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL_CLOSE' | 'SIGNAL_REVERSAL';
  riskRewardAchieved: number;
  liquidationPrice?: number;
}

export interface AssetScanningState {
  symbol: string;
  category: string;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  isQualified: boolean;
  disqualificationReason?: string;
  // Live Strategy Indicators
  pmaxDir: 1 | -1;
  pmaxMAvg: number;
  pmaxLine: number;
  pmaxSignal: 'BUY' | 'SELL' | 'HOLD';
  proScalperOsc: number;
  proScalperConfirmed: boolean;
  signalStatus: 'READY_BUY' | 'READY_SELL' | 'CONFIRMED_BUY' | 'CONFIRMED_SELL' | 'NEUTRAL';
  lastSignalTime?: number;
  swingLow: number;
  swingHigh: number;
  recentPnlPercent?: number;
  activeTradeId?: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  description: string;
  assets: AssetScanningState[];
  avgChange24h: number;
  maxChange24h: number;
  activeTradesCount: number;
  totalCategoryNetPnl: number;
  totalCategoryNetPnlPercent: number;
  qualificationCriteria: {
    minVolume24h: number;
    maxSpread: number;
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'SCANNER' | 'EXECUTION' | 'TP_SL' | 'FEES' | 'SYSTEM' | 'WEBSOCKET';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category?: string;
  symbol?: string;
  message: string;
  details?: Record<string, any>;
}

export interface TradingSettings {
  apiKey: string;
  apiSecret: string;
  isLiveTrading: boolean;
  startingBalance: number; // Fixed initial balance, never changes
  currentBalance: number;
  minimumReserveBuffer: number; // Locked at $1.20
  balanceRiskPercent: number; // 10% per trade
  defaultLeverage: number; // 10x or 15x dynamic
  takerFeeRate: number; // e.g. 0.0005 (0.05%)
  makerFeeRate: number; // e.g. 0.0002 (0.02%)
  swingLookbackBars: number;
  maxOpenPositions: number;
  autoTradingEnabled: boolean;
  useTrailingStop: boolean;
  trailingActivationPercent: number;
  whitelistedIp: string;
  soundEnabled: boolean;
}

export interface PnLDataPoint {
  timestamp: number;
  balance: number;
  netPnl: number;
  netPnlPercent: number;
  label: string;
}
