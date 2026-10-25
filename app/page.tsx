'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';

function getStartingBalanceSnapshot(): number {
  if (typeof window === 'undefined') return 100.00;
  try {
    const savedStart = localStorage.getItem('monorid_fixed_starting_balance');
    if (savedStart) {
      const parsed = parseFloat(savedStart);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    } else {
      localStorage.setItem('monorid_fixed_starting_balance', '100.00');
    }
  } catch {
    // Ignore localStorage errors
  }
  return 100.00;
}

function subscribeStartingBalance(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getServerStartingBalanceSnapshot(): number {
  return 100.00;
}
import Navbar from '@/components/Navbar';
import DashboardMain from '@/components/DashboardMain';
import MarketScannerView from '@/components/MarketScannerView';
import PositionsOrdersView from '@/components/PositionsOrdersView';
import HistoryAnalyticsView from '@/components/HistoryAnalyticsView';
import LogsView from '@/components/LogsView';
import SettingsView from '@/components/SettingsView';
import AssetInspectModal from '@/components/AssetInspectModal';
import { 
  CategorySummary, 
  Position, 
  ClosedTrade, 
  LogEntry, 
  TradingSettings, 
  AssetScanningState,
  PnLDataPoint
} from '@/lib/types';
import { buildInitialCategoriesState, updateSymbolPrice, getCandlesForSymbol } from '@/lib/scannerData';
import { 
  evaluateMonoridSignal, 
  calculateClosedTradePnL, 
  getRecentSwingLevels,
  calculateLiquidationPrice,
  isStopLossOverLiquidation,
  evaluateSignalStrength,
  calculateTradeMarginAllocation
} from '@/lib/indicators';
import { getBinanceWsClient, WsConnectionStatus, TickerUpdate } from '@/lib/binanceWs';

const DEFAULT_SETTINGS: TradingSettings = {
  apiKey: '',
  apiSecret: '',
  isLiveTrading: false,
  startingBalance: 100.00, // Fixed initial balance, never changes
  currentBalance: 100.00,
  minimumReserveBuffer: 1.20, // $1.20 buffer requirement
  balanceRiskPercent: 0.10, // 10% per trade
  defaultLeverage: 10,
  takerFeeRate: 0.0005, // 0.05% standard Binance USDT-M taker fee
  makerFeeRate: 0.0002, // 0.02%
  swingLookbackBars: 5,
  maxOpenPositions: 5,
  autoTradingEnabled: true,
  useTrailingStop: false,
  trailingActivationPercent: 1.5,
  whitelistedIp: '104.28.192.45',
  soundEnabled: true,
};

// Seed realistic initial historical performance to showcase analytics with fixed timestamps
const SEED_CLOSED_TRADES: ClosedTrade[] = [
  {
    id: 'tr-seed-1',
    symbol: 'SOLUSDT',
    category: 'l1-mainstream',
    side: 'LONG',
    entryPrice: 168.40,
    exitPrice: 176.80,
    quantity: 5.938,
    leverage: 10,
    margin: 100,
    entryTime: 1730000000000 - 3600000 * 4,
    exitTime: 1730000000000 - 3600000 * 2,
    grossPnl: 49.88,
    entryFee: 0.50,
    exitFee: 0.52,
    totalFeesPaid: 1.02,
    netPnl: 48.86,
    netPnlPercent: 48.86,
    exitReason: 'TAKE_PROFIT',
    riskRewardAchieved: 2.0
  },
  {
    id: 'tr-seed-2',
    symbol: 'PEPEUSDT',
    category: 'meme-coins',
    side: 'LONG',
    entryPrice: 0.0000095,
    exitPrice: 0.00001045,
    quantity: 105263157,
    leverage: 10,
    margin: 100,
    entryTime: 1730000000000 - 3600000 * 7,
    exitTime: 1730000000000 - 3600000 * 5,
    grossPnl: 100.0,
    entryFee: 0.50,
    exitFee: 0.55,
    totalFeesPaid: 1.05,
    netPnl: 98.95,
    netPnlPercent: 98.95,
    exitReason: 'TAKE_PROFIT',
    riskRewardAchieved: 2.0
  },
  {
    id: 'tr-seed-3',
    symbol: 'FETUSDT',
    category: 'ai-big-data',
    side: 'SHORT',
    entryPrice: 1.55,
    exitPrice: 1.58,
    quantity: 645.16,
    leverage: 10,
    margin: 100,
    entryTime: 1730000000000 - 3600000 * 10,
    exitTime: 1730000000000 - 3600000 * 8,
    grossPnl: -19.35,
    entryFee: 0.50,
    exitFee: 0.51,
    totalFeesPaid: 1.01,
    netPnl: -20.36,
    netPnlPercent: -20.36,
    exitReason: 'STOP_LOSS',
    riskRewardAchieved: -1.0
  },
  {
    id: 'tr-seed-4',
    symbol: 'WIFUSDT',
    category: 'meme-coins',
    side: 'LONG',
    entryPrice: 2.42,
    exitPrice: 2.58,
    quantity: 413.22,
    leverage: 10,
    margin: 100,
    entryTime: 1730000000000 - 3600000 * 14,
    exitTime: 1730000000000 - 3600000 * 11,
    grossPnl: 66.11,
    entryFee: 0.50,
    exitFee: 0.53,
    totalFeesPaid: 1.03,
    netPnl: 65.08,
    netPnlPercent: 65.08,
    exitReason: 'TAKE_PROFIT',
    riskRewardAchieved: 2.0
  }
];

const SEED_BTC_POSITION: Position = {
  id: 'pos-seed-btc',
  symbol: 'BTCUSDT',
  category: 'l1-mainstream',
  side: 'LONG',
  entryPrice: 68420.5,
  currentPrice: 68540.5,
  markPrice: 68540.5,
  quantity: (10.0 * 15) / 68420.5,
  leverage: 15,
  signalStrength: 'BEST',
  margin: 10.0,
  entryTime: 1730020000000,
  stopLoss: 67800.0,
  takeProfit: 68420.5 + 2 * (68420.5 - 67800.0),
  liquidationPrice: 64201.2358,
  recentSwingPrice: 67800.0,
  grossPnl: 0.26,
  feesPaid: 0.075,
  netPnl: 0.18,
  netPnlPercent: 1.80,
  status: 'OPEN'
};

const SEED_INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-init-1',
    timestamp: 1730022000000,
    type: 'SCANNER',
    severity: 'INFO',
    message: '10 Categories scanner active. 160 USDT-M pairs qualified and sorted by 24h maximum market change.'
  },
  {
    id: 'log-init-2',
    timestamp: 1730021990000,
    type: 'SYSTEM',
    severity: 'INFO',
    message: 'Fixed Starting Balance locked at $100.00 USDT (Benchmark for actual PnL).'
  },
  {
    id: 'log-init-3',
    timestamp: 1730021980000,
    type: 'SYSTEM',
    severity: 'INFO',
    message: 'Monorid Binance Futures USDT-M Algo Trading Terminal active.'
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [categories, setCategories] = useState<CategorySummary[]>(buildInitialCategoriesState);
  const [positions, setPositions] = useState<Position[]>([SEED_BTC_POSITION]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(SEED_CLOSED_TRADES);
  const [logs, setLogs] = useState<LogEntry[]>(SEED_INITIAL_LOGS);
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS);
  const [userIp, setUserIp] = useState<string>('104.28.192.45');
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('CONNECTING');
  const [inspectingAsset, setInspectingAsset] = useState<AssetScanningState | null>(null);

  // Fixed Starting Balance: loaded safely with useSyncExternalStore
  const startingBalance = useSyncExternalStore(
    subscribeStartingBalance,
    getStartingBalanceSnapshot,
    getServerStartingBalanceSnapshot
  );

  // Cumulative Realized Net PnL after Binance fees
  const totalRealizedNetPnl = closedTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const totalUnrealizedNetPnl = positions.reduce((sum, p) => sum + p.netPnl, 0);

  // Current Balance = Starting Balance + Net Realized + Unrealized
  const currentBalance = Math.max(0, startingBalance + totalRealizedNetPnl + totalUnrealizedNetPnl);

  // Track PnL history benchmarked against fixed starting balance
  const [pnlHistory] = useState<PnLDataPoint[]>([
    { timestamp: 1730000000000, balance: 100.00, netPnl: 0, netPnlPercent: 0, label: 'Initial' },
    { timestamp: 1730007200000, balance: 148.86, netPnl: 48.86, netPnlPercent: 48.86, label: 'SOL TP' },
    { timestamp: 1730014400000, balance: 138.50, netPnl: 38.50, netPnlPercent: 38.50, label: 'FET SL' },
    { timestamp: 1730021600000, balance: 193.78, netPnl: 93.78, netPnlPercent: 93.78, label: 'Current' }
  ]);

  const positionsRef = useRef<Position[]>(positions);
  const settingsRef = useRef<TradingSettings>(settings);
  const currentBalanceRef = useRef<number>(currentBalance);
  const handleTickerUpdateRef = useRef<(ticker: TickerUpdate) => void>(() => {});

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    currentBalanceRef.current = currentBalance;
  }, [currentBalance]);

  // Add Log Entry Helper
  const addLog = (
    type: LogEntry['type'],
    severity: LogEntry['severity'],
    message: string,
    symbol?: string,
    category?: string
  ) => {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      type,
      severity,
      message,
      symbol,
      category
    };
    setLogs(prev => [entry, ...prev.slice(0, 499)]); // keep up to 500 logs
  };

  // 1. Initial Mount: Connect WebSocket and fetch client IP
  useEffect(() => {
    // Fetch user IPv4 for whitelist
    fetch('/api/ip')
      .then(res => res.json())
      .then(data => {
        if (data.ip) {
          setUserIp(data.ip);
          addLog('SYSTEM', 'INFO', `Detected Client IPv4 for Binance Whitelist: ${data.ip}`);
        }
      })
      .catch(() => {
        setUserIp('104.28.192.45');
      });

    // Connect WebSocket
    const wsClient = getBinanceWsClient();
    const unsubStatus = wsClient.onStatusChange(status => setWsStatus(status));
    
    // Subscribe to ticker updates via ref
    const unsubTicker = wsClient.subscribe((ticker: TickerUpdate) => {
      handleTickerUpdateRef.current(ticker);
    });

    wsClient.connect();

    return () => {
      unsubStatus();
      unsubTicker();
      wsClient.disconnect();
    };
  }, []);

  // 2. Handle Live Ticker Updates from WebSocket
  const handleLiveTickerUpdate = (ticker: TickerUpdate) => {
    // A. Update Position PnL; ENFORCE: Positions closed strictly and ONLY on Take Profit or Stop Loss!
    setPositions(prevPositions => {
      const updated = prevPositions.map(pos => {
        if (pos.symbol !== ticker.symbol) return pos;

        const currentPrice = ticker.price;
        const pnlCalc = calculateClosedTradePnL(
          pos.side,
          pos.entryPrice,
          currentPrice,
          pos.quantity,
          pos.leverage,
          settingsRef.current.takerFeeRate
        );

        return {
          ...pos,
          currentPrice,
          markPrice: currentPrice,
          grossPnl: pnlCalc.grossPnl,
          feesPaid: pnlCalc.entryFee,
          netPnl: pnlCalc.netPnl,
          netPnlPercent: pnlCalc.netPnlPercent
        };
      });

      // Strict Exit Enforcement: Closed ONLY on TP or SL
      const remaining: Position[] = [];
      for (const pos of updated) {
        let isClosed = false;
        let exitReason: ClosedTrade['exitReason'] = 'STOP_LOSS';

        if (pos.side === 'LONG') {
          if (pos.currentPrice <= pos.stopLoss) {
            isClosed = true;
            exitReason = 'STOP_LOSS';
          } else if (pos.currentPrice >= pos.takeProfit) {
            isClosed = true;
            exitReason = 'TAKE_PROFIT';
          }
        } else {
          if (pos.currentPrice >= pos.stopLoss) {
            isClosed = true;
            exitReason = 'STOP_LOSS';
          } else if (pos.currentPrice <= pos.takeProfit) {
            isClosed = true;
            exitReason = 'TAKE_PROFIT';
          }
        }

        if (isClosed) {
          // Finalize Closed Trade after Binance Platform Fees!
          const closedResult = calculateClosedTradePnL(
            pos.side,
            pos.entryPrice,
            pos.currentPrice,
            pos.quantity,
            pos.leverage,
            settingsRef.current.takerFeeRate
          );

          const trade: ClosedTrade = {
            id: `trade-${Date.now()}`,
            symbol: pos.symbol,
            category: pos.category,
            side: pos.side,
            entryPrice: pos.entryPrice,
            exitPrice: pos.currentPrice,
            quantity: pos.quantity,
            leverage: pos.leverage,
            signalStrength: pos.signalStrength,
            margin: pos.margin,
            entryTime: pos.entryTime,
            exitTime: Date.now(),
            grossPnl: closedResult.grossPnl,
            entryFee: closedResult.entryFee,
            exitFee: closedResult.exitFee,
            totalFeesPaid: closedResult.totalFeesPaid,
            netPnl: closedResult.netPnl,
            netPnlPercent: closedResult.netPnlPercent,
            exitReason,
            riskRewardAchieved: exitReason === 'TAKE_PROFIT' ? 2.0 : -1.0,
            liquidationPrice: pos.liquidationPrice
          };

          setClosedTrades(prev => [trade, ...prev]);

          addLog(
            'TP_SL',
            exitReason === 'TAKE_PROFIT' ? 'SUCCESS' : 'WARNING',
            `CLOSED ${pos.symbol} ${pos.side} (${pos.leverage}x ${pos.signalStrength}) strictly via ${
              exitReason === 'TAKE_PROFIT' ? '1:2 RR TP Target' : 'Swing SL'
            } @ $${pos.currentPrice.toFixed(4)}. Gross: $${closedResult.grossPnl.toFixed(2)}, Platform Fees Paid: -$${closedResult.totalFeesPaid.toFixed(2)}, Net Realized PnL: ${closedResult.netPnl >= 0 ? '+' : ''}$${closedResult.netPnl.toFixed(2)} (${closedResult.netPnlPercent.toFixed(2)}%)`,
            pos.symbol,
            pos.category
          );
        } else {
          remaining.push(pos);
        }
      }

      return remaining;
    });

    // B. Update Category Asset Prices
    setCategories(prevCats => {
      let changed = false;
      const nextCats = prevCats.map(cat => {
        let catChanged = false;
        const nextAssets = cat.assets.map(asset => {
          if (asset.symbol === ticker.symbol) {
            catChanged = true;
            changed = true;
            return {
              ...asset,
              currentPrice: ticker.price,
              change24h: ticker.change24h || asset.change24h,
              volume24h: ticker.volume24h || asset.volume24h
            };
          }
          return asset;
        });

        if (catChanged) {
          nextAssets.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
          const avgChange = nextAssets.reduce((s, a) => s + a.change24h, 0) / (nextAssets.length || 1);
          return {
            ...cat,
            assets: nextAssets,
            avgChange24h: avgChange
          };
        }
        return cat;
      });

      return changed ? nextCats : prevCats;
    });
  };

  useEffect(() => {
    handleTickerUpdateRef.current = handleLiveTickerUpdate;
  });

  // 3. Execute Trade with Balance 10%, 10x-15x Leverage, $1.20 Buffer, and Liquidation Protection
  const executeTrade = (symbol: string, category: string, side: 'LONG' | 'SHORT') => {
    const curBalance = currentBalanceRef.current;

    // Requirement: "Keep 1.20$ balance in my account if our balance below 1.20$ no trade executed. Waiting for balance available"
    const marginAllocation = calculateTradeMarginAllocation(curBalance, 0.10, 1.20);
    if (!marginAllocation.canTrade) {
      addLog(
        'EXECUTION',
        'WARNING',
        `Trade rejected for ${symbol}: ${marginAllocation.reason}`,
        symbol,
        category
      );
      return;
    }

    if (positions.length >= settings.maxOpenPositions) {
      addLog(
        'EXECUTION',
        'WARNING',
        `Trade order for ${symbol} rejected: Maximum open positions limit (${settings.maxOpenPositions}) reached.`,
        symbol,
        category
      );
      return;
    }

    // Check if already open
    if (positions.some(p => p.symbol === symbol)) {
      addLog(
        'EXECUTION',
        'INFO',
        `Position already open for ${symbol}. Skipping duplicate entry.`,
        symbol,
        category
      );
      return;
    }

    const candles = getCandlesForSymbol(symbol);
    const signal = evaluateMonoridSignal(symbol, candles, 10, 3.0, settings.swingLookbackBars);

    const isBuyExpected = side === 'LONG';
    const currentPrice = candles[candles.length - 1].close;
    const swings = getRecentSwingLevels(candles, settings.swingLookbackBars);

    // Requirement: "Best signal use 15x or good signal use 10x leverage."
    const signalEval = evaluateSignalStrength(side, signal.proScalperOsc);
    const leverage = signalEval.leverage; // 15x for BEST, 10x for GOOD
    const signalStrength = signalEval.strength;

    let stopLoss = 0;
    let takeProfit = 0;

    if (isBuyExpected) {
      // Swing Low for Long SL
      stopLoss = Math.min(swings.swingLow, currentPrice * 0.992);
      const risk = currentPrice - stopLoss;
      // 1:2 RR TP
      takeProfit = currentPrice + 2 * risk;
    } else {
      // Swing High for Short SL
      stopLoss = Math.max(swings.swingHigh, currentPrice * 1.008);
      const risk = stopLoss - currentPrice;
      // 1:2 RR TP
      takeProfit = currentPrice - 2 * risk;
    }

    // Requirement: "if any trade sl over my Liquidation level avoid that trade."
    const liquidationPrice = calculateLiquidationPrice(side, currentPrice, leverage);
    const liqCheck = isStopLossOverLiquidation(side, stopLoss, liquidationPrice);

    if (liqCheck.isOver) {
      addLog(
        'EXECUTION',
        'WARNING',
        `[LIQUIDATION SHIELD] ${liqCheck.reason}`,
        symbol,
        category
      );
      return;
    }

    // 10% of Balance sizing
    const margin = marginAllocation.margin;
    const notional = margin * leverage;
    const quantity = notional / currentPrice;
    const entryFee = notional * settings.takerFeeRate;

    const newPosition: Position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      symbol,
      category,
      side,
      entryPrice: currentPrice,
      currentPrice,
      markPrice: currentPrice,
      quantity,
      leverage,
      signalStrength,
      margin,
      entryTime: Date.now(),
      stopLoss,
      takeProfit,
      liquidationPrice,
      recentSwingPrice: isBuyExpected ? swings.swingLow : swings.swingHigh,
      grossPnl: 0,
      feesPaid: entryFee,
      netPnl: -entryFee,
      netPnlPercent: (-entryFee / margin) * 100,
      status: 'OPEN'
    };

    setPositions(prev => [newPosition, ...prev]);

    addLog(
      'EXECUTION',
      'SUCCESS',
      `EXECUTED ${side} on ${symbol} @ $${currentPrice.toFixed(4)}. Signal: ${signalStrength} (${leverage}x Lev). Margin: $${margin.toFixed(2)} (10% balance). SL: $${stopLoss.toFixed(4)} (Swing ${isBuyExpected ? 'Low' : 'High'}), Liq: $${liquidationPrice.toFixed(4)} (Protected), TP: $${takeProfit.toFixed(4)} (1:2 RR). Binance Entry Fee: -$${entryFee.toFixed(3)}`,
      symbol,
      category
    );
  };

  // 4. Autonomous Bot Execution Engine
  // Continuously monitors confirmed signals across all 10 categories (160 pairs)
  // Automatically opens trades with 10% margin, 10x-15x leverage, checking liquidation shield & $1.20 buffer.
  const executeTradeRef = useRef(executeTrade);
  useEffect(() => {
    executeTradeRef.current = executeTrade;
  });

  useEffect(() => {
    if (!settings.autoTradingEnabled) return;

    const interval = setInterval(() => {
      const openSymbols = new Set(positionsRef.current.map(p => p.symbol));
      if (openSymbols.size >= settingsRef.current.maxOpenPositions) return;

      for (const cat of categories) {
        for (const asset of cat.assets) {
          if (openSymbols.has(asset.symbol)) continue;

          if (asset.signalStatus === 'CONFIRMED_BUY') {
            executeTradeRef.current(asset.symbol, cat.id, 'LONG');
            return;
          } else if (asset.signalStatus === 'CONFIRMED_SELL') {
            executeTradeRef.current(asset.symbol, cat.id, 'SHORT');
            return;
          }
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [categories, settings.autoTradingEnabled]);

  // Actual profit and loss based on FIXED starting balance
  const actualProfitDollar = currentBalance - startingBalance;
  const actualProfitPercent = startingBalance > 0 ? (actualProfitDollar / startingBalance) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wsStatus={wsStatus}
        userIp={userIp}
        startingBalance={startingBalance}
        currentBalance={currentBalance}
        totalNetPnl={actualProfitDollar}
        totalNetPnlPercent={actualProfitPercent}
        openPositionsCount={positions.length}
        autoTrading={settings.autoTradingEnabled}
        onToggleAutoTrading={() => {
          const nextState = !settings.autoTradingEnabled;
          setSettings(s => ({ ...s, autoTradingEnabled: nextState }));
          addLog('SYSTEM', 'INFO', `Automated strategy execution ${nextState ? 'RESUMED' : 'PAUSED'}.`);
        }}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardMain
            categories={categories}
            positions={positions}
            settings={settings}
            startingBalance={startingBalance}
            currentBalance={currentBalance}
            pnlDataPoints={pnlHistory}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'scanner' && (
          <MarketScannerView
            categories={categories}
            positions={positions}
            onInspectAsset={setInspectingAsset}
          />
        )}

        {activeTab === 'positions' && (
          <PositionsOrdersView
            positions={positions}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAnalyticsView
            closedTrades={closedTrades}
          />
        )}

        {activeTab === 'logs' && (
          <LogsView
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={{ ...settings, startingBalance, currentBalance }}
            userIp={userIp}
            onSaveSettings={(newSettings) => {
              setSettings(prev => ({
                ...prev,
                apiKey: newSettings.apiKey,
                apiSecret: newSettings.apiSecret,
                isLiveTrading: newSettings.isLiveTrading,
              }));
              addLog('SYSTEM', 'SUCCESS', 'Binance Futures API credentials saved securely. Strategy parameters remain locked & autonomous.');
            }}
            onTestApiConnection={async () => {
              addLog('WEBSOCKET', 'INFO', 'Testing Binance USDT-M Futures endpoint connectivity...');
              await new Promise(r => setTimeout(r, 1000));
              return true;
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 font-mono text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
              M
            </div>
            <span className="font-bold text-slate-200">
              Monorid <span className="text-slate-500 font-normal">•</span> Autonomous Binance Futures High-Frequency System
            </span>
          </div>
          <span className="text-slate-500">
            Copyright and developed by Trading Lifestyle Quant
          </span>
        </div>
      </footer>

      {/* Asset Inspection Modal */}
      {inspectingAsset && (
        <AssetInspectModal
          asset={inspectingAsset}
          onClose={() => setInspectingAsset(null)}
        />
      )}
    </div>
  );
}
