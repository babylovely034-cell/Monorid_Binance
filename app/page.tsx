'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import DashboardMain from '@/components/DashboardMain';
import { MiroStyleLogo } from '@/components/MiroStyleLogo';
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
import { 
  buildInitialCategoriesState, 
  updateSymbolPrice, 
  getCandlesForSymbol, 
  setCandlesForSymbol,
  checkAssetQualification 
} from '@/lib/scannerData';
import { 
  evaluateMonoridSignal, 
  calculatePMax,
  calculateProScalperAI,
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
  isLiveTrading: true,
  startingBalance: 0,
  currentBalance: 0,
  availableBalance: 0,
  minimumReserveBuffer: 1.20, // $1.20 minimum reserve requirement
  balanceRiskPercent: 0.10, // 10% per trade
  defaultLeverage: 10,
  takerFeeRate: 0.0005, // 0.05% standard Binance USDT-M taker fee
  makerFeeRate: 0.0002, // 0.02%
  swingLookbackBars: 5,
  maxOpenPositions: 10,
  autoTradingEnabled: true,
  autoShieldEnabled: true,
  useTrailingStop: false,
  trailingActivationPercent: 1.5,
  whitelistedIp: '104.28.192.45',
  soundEnabled: true,
};

const INITIAL_AUDIT_LOGS: LogEntry[] = [
  {
    id: 'log-prod-1',
    timestamp: Date.now(),
    type: 'SYSTEM',
    severity: 'SUCCESS',
    message: 'Monorid Autonomous Binance Futures Production Terminal active. Trading Lifestyle Quant quantitative engine initialized.'
  },
  {
    id: 'log-prod-2',
    timestamp: Date.now() - 1000,
    type: 'SCANNER',
    severity: 'INFO',
    message: '10 Categories scanner online. Monitoring 160 USDT-M pairs with Dual-Engine Quant (EMA 10, ATR 10, Mult 3.0) & Multi-Factor Momentum (ADX 14, Stoch RSI 12, OBV 50, HMA 21).'
  },
  {
    id: 'log-prod-3',
    timestamp: Date.now() - 2000,
    type: 'EXECUTION',
    severity: 'INFO',
    message: 'Production Risk Parameters: $1.20 reserve safety check, 10% balance sizing, 10x-15x dynamic leverage, 1:2 RR TP, and liquidation shield active.'
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [categories, setCategories] = useState<CategorySummary[]>(buildInitialCategoriesState);
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [sessionStartTime] = useState<number>(() => Date.now());
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<TradingSettings>(DEFAULT_SETTINGS);
  const [userIp, setUserIp] = useState<string>('104.28.192.45');
  const [wsStatus, setWsStatus] = useState<WsConnectionStatus>('CONNECTING');
  const [inspectingAsset, setInspectingAsset] = useState<AssetScanningState | null>(null);

  const [liveStartingBalance, setLiveStartingBalance] = useState<number>(0);
  const [liveCurrentBalance, setLiveCurrentBalance] = useState<number>(0);
  const [liveAvailableBalance, setLiveAvailableBalance] = useState<number>(0);
  const [pnlHistory, setPnlHistory] = useState<PnLDataPoint[]>([]);

  const [protectingSymbols, setProtectingSymbols] = useState<string[]>([]);
  const [isProtectingAll, setIsProtectingAll] = useState<boolean>(false);

  const positionsRef = useRef<Position[]>(positions);
  const settingsRef = useRef<TradingSettings>(settings);
  const currentBalanceRef = useRef<number>(liveCurrentBalance);
  const availableBalanceRef = useRef<number>(liveAvailableBalance);
  const categoriesRef = useRef<CategorySummary[]>(categories);
  const rejectedSymbolsCooldownRef = useRef<Map<string, number>>(new Map());
  const lastCategoryIndexRef = useRef<number>(0);
  const handleTickerUpdateRef = useRef<(ticker: TickerUpdate) => void>(() => {});
  const inFlightProtectRef = useRef<Set<string>>(new Set());
  const lastProtectAttemptRef = useRef<Map<string, number>>(new Map());
  const handleProtectPositionRef = useRef<(symbol: string, sl?: number, tp?: number) => Promise<void>>((async () => {}) as any);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    currentBalanceRef.current = liveCurrentBalance;
  }, [liveCurrentBalance]);

  useEffect(() => {
    availableBalanceRef.current = liveAvailableBalance;
  }, [liveAvailableBalance]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

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
    setLogs(prev => [entry, ...prev.slice(0, 499)]); // keep up to 500 audit logs
  };

  // 1. Initial Load: Retrieve saved API credentials from localStorage and client IP
  useEffect(() => {
    // Detect Client IPv4 for Binance Whitelisting
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

    // Load API Keys and settings from localStorage
    try {
      const savedKey = localStorage.getItem('monorid_binance_api_key') || '';
      const savedSecret = localStorage.getItem('monorid_binance_api_secret') || '';
      const savedMaxPos = localStorage.getItem('monorid_binance_max_positions');
      const parsedMaxPos = savedMaxPos ? parseInt(savedMaxPos, 10) : NaN;

      setSettings(prev => ({
        ...prev,
        apiKey: savedKey || prev.apiKey,
        apiSecret: savedSecret || prev.apiSecret,
        maxOpenPositions: (!isNaN(parsedMaxPos) && parsedMaxPos > 0) ? parsedMaxPos : prev.maxOpenPositions
      }));
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // 2. Fetch Live Binance Account Overview & Positions
  const syncAccountData = async (apiKey?: string, apiSecret?: string) => {
    const key = apiKey || settingsRef.current.apiKey;
    const secret = apiSecret || settingsRef.current.apiSecret;
    if (!key || !secret) return;

    try {
      const headers: Record<string, string> = {
        'x-binance-api-key': key,
        'x-binance-api-secret': secret
      };

      const res = await fetch('/api/binance/account', { headers });
      const data = await res.json();

      if (res.ok && data.success) {
        const wallet = data.walletBalance || 0;
        const available = data.availableBalance !== undefined ? data.availableBalance : wallet;

        setLiveCurrentBalance(wallet);
        setLiveAvailableBalance(available);
        currentBalanceRef.current = wallet;
        availableBalanceRef.current = available;

        setLiveStartingBalance(prev => {
          if (prev === 0 && wallet > 0) {
            setPnlHistory([
              {
                timestamp: Date.now(),
                balance: wallet,
                netPnl: 0,
                netPnlPercent: 0,
                label: 'Benchmark'
              }
            ]);
            return wallet;
          }
          return prev || wallet;
        });

        // Sync live open positions from Binance, preserving existing tracked order targets
        if (Array.isArray(data.openPositions)) {
          setPositions(prev => {
            const prevMap = new Map(prev.map(p => [p.symbol, p]));
            const now = Date.now();
            return data.openPositions.map((livePos: Position) => {
              const existing = prevMap.get(livePos.symbol);
              const lastProtect = lastProtectAttemptRef.current.get(livePos.symbol) || 0;
              const isRecentProtect = now - lastProtect < 30000;
              return {
                ...livePos,
                id: existing?.id || livePos.id,
                stopLoss: livePos.stopLoss || (isRecentProtect && existing?.stopLoss ? existing.stopLoss : 0),
                takeProfit: livePos.takeProfit || (isRecentProtect && existing?.takeProfit ? existing.takeProfit : 0),
                leverage: livePos.leverage || existing?.leverage || 10,
                signalStrength: existing?.signalStrength || livePos.signalStrength,
                margin: livePos.margin || existing?.margin || 0,
                feesPaid: existing?.feesPaid || 0,
                category: existing?.category || livePos.category,
                binanceOrderId: existing?.binanceOrderId || livePos.binanceOrderId,
                stopLossOrderId: livePos.stopLossOrderId || (isRecentProtect ? existing?.stopLossOrderId : undefined),
                takeProfitOrderId: livePos.takeProfitOrderId || (isRecentProtect ? existing?.takeProfitOrderId : undefined)
              };
            });
          });

          // Auto-Shield running trades that have no TP and SL
          if (settingsRef.current.autoShieldEnabled !== false) {
            const now = Date.now();
            for (const livePos of data.openPositions) {
              const lastAttempt = lastProtectAttemptRef.current.get(livePos.symbol) || 0;
              const isRecentAttempt = now - lastAttempt < 20000; // 20s cooldown
              const isInFlight = inFlightProtectRef.current.has(livePos.symbol);
              const needsShield = (!livePos.stopLoss || livePos.stopLoss === 0) || (!livePos.takeProfit || livePos.takeProfit === 0);

              if (needsShield && !isRecentAttempt && !isInFlight) {
                handleProtectPositionRef.current(livePos.symbol);
              }
            }
          }
        }
      }
    } catch {
      // Sync failed silently, will retry on next poll
    }
  };

  // 3. Fetch Real Trade History from Binance
  const syncTradeHistory = async (apiKey?: string, apiSecret?: string) => {
    const key = apiKey || settingsRef.current.apiKey;
    const secret = apiSecret || settingsRef.current.apiSecret;
    if (!key || !secret) return;

    try {
      const res = await fetch('/api/binance/history?limit=30', {
        headers: {
          'x-binance-api-key': key,
          'x-binance-api-secret': secret
        }
      });
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.trades)) {
        // Filter out position entry fills (realizedPnl === 0) so only true closed trades are processed
        const closingFills = data.trades.filter((t: any) => Math.abs(parseFloat(t.realizedPnl || '0')) > 0.000001);

        const formatted: ClosedTrade[] = closingFills.map((t: any): ClosedTrade => {
          const qty = parseFloat(t.qty);
          const price = parseFloat(t.price);
          const commission = parseFloat(t.commission || '0');
          const realizedPnl = parseFloat(t.realizedPnl || '0');
          const isBuyer = t.buyer === true || t.side === 'BUY';
          const margin = (qty * price) / 10;

          return {
            id: `trade-${t.id}`,
            symbol: t.symbol,
            category: 'live-binance',
            side: isBuyer ? 'LONG' : 'SHORT',
            entryPrice: price,
            exitPrice: price,
            quantity: qty,
            leverage: 10,
            margin: margin || 10,
            entryTime: t.time - 60000,
            exitTime: t.time,
            grossPnl: realizedPnl + commission,
            entryFee: commission / 2,
            exitFee: commission / 2,
            totalFeesPaid: commission,
            netPnl: realizedPnl,
            netPnlPercent: margin > 0 ? (realizedPnl / margin) * 100 : 0,
            exitReason: realizedPnl > 0 ? 'TAKE_PROFIT' : 'STOP_LOSS',
            riskRewardAchieved: realizedPnl > 0 ? 2.0 : -1.0
          };
        }).sort((a: ClosedTrade, b: ClosedTrade) => b.exitTime - a.exitTime); // Newest first

        setClosedTrades(formatted);
      }
    } catch {
      // History sync error
    }
  };

  // 4. Fetch Real 24hr Tickers across all symbols
  const syncRealTickers = async () => {
    try {
      const res = await fetch('/api/binance/tickers');
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.tickers)) {
        const tickerMap = new Map<string, any>();
        for (const t of data.tickers) {
          tickerMap.set(t.symbol, t);
        }

        setCategories(prevCats => {
          return prevCats.map(cat => {
            const updatedAssets = cat.assets.map(asset => {
              const live = tickerMap.get(asset.symbol);
              if (live) {
                const price = parseFloat(live.lastPrice);
                const change = parseFloat(live.priceChangePercent);
                const volume = parseFloat(live.quoteVolume);
                const high = parseFloat(live.highPrice);
                const low = parseFloat(live.lowPrice);
                const qual = checkAssetQualification({ volume24h: volume, change24h: change, price });

                return {
                  ...asset,
                  currentPrice: price || asset.currentPrice,
                  change24h: change || asset.change24h,
                  volume24h: volume || asset.volume24h,
                  high24h: high || asset.high24h,
                  low24h: low || asset.low24h,
                  isQualified: qual.isQualified,
                  disqualificationReason: qual.reason
                };
              }
              return asset;
            });

            // Sort 16 assets by absolute 24h change descending
            updatedAssets.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
            const avgChange = updatedAssets.reduce((s, a) => s + a.change24h, 0) / (updatedAssets.length || 1);
            const maxChange = Math.max(...updatedAssets.map(a => Math.abs(a.change24h)));

            return {
              ...cat,
              assets: updatedAssets,
              avgChange24h: avgChange,
              maxChange24h: maxChange
            };
          });
        });
      }
    } catch {
      // Tickers sync error
    }
  };

  // 5. Fetch real 5m Binance candles rotating across all assets in the categories
  const klineRotationCursorRef = useRef<number>(0);

  const syncRotatingKlines = async (isInitial: boolean = false) => {
    try {
      const currentCats = categoriesRef.current;
      if (currentCats.length === 0) return;

      // Interleave assets across all categories so all categories get updated evenly
      const orderedSymbols: string[] = [];
      const seen = new Set<string>();

      if (isInitial) {
        // On initial boot, prioritize the top mover of each category
        for (const cat of currentCats) {
          const sym = cat.assets[0]?.symbol;
          if (sym && !seen.has(sym)) {
            seen.add(sym);
            orderedSymbols.push(sym);
          }
        }
      } else {
        for (let idx = 0; idx < 16; idx++) {
          for (const cat of currentCats) {
            const sym = cat.assets[idx]?.symbol;
            if (sym && !seen.has(sym)) {
              seen.add(sym);
              orderedSymbols.push(sym);
            }
          }
        }
      }

      if (orderedSymbols.length === 0) return;

      const batchSize = isInitial ? 10 : 15;
      const start = isInitial ? 0 : (klineRotationCursorRef.current % orderedSymbols.length);
      const batch: string[] = [];
      for (let i = 0; i < batchSize; i++) {
        const sym = orderedSymbols[(start + i) % orderedSymbols.length];
        if (sym && !batch.includes(sym)) {
          batch.push(sym);
        }
      }

      if (!isInitial) {
        klineRotationCursorRef.current = (start + batchSize) % orderedSymbols.length;
      }

      const fetchedSymbols = new Set<string>();
      await Promise.allSettled(
        batch.map(async (sym) => {
          try {
            const res = await fetch(`/api/binance/klines?symbol=${sym}&interval=5m&limit=60`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && Array.isArray(data.klines) && data.klines.length >= 20) {
                setCandlesForSymbol(sym, data.klines);
                fetchedSymbols.add(sym);
              }
            }
          } catch {}
        })
      );

      if (fetchedSymbols.size === 0) return;

      setCategories(prevCats => {
        return prevCats.map(cat => {
          const nextAssets = cat.assets.map(asset => {
            if (!fetchedSymbols.has(asset.symbol)) return asset;

            const candles = getCandlesForSymbol(asset.symbol);
            if (candles.length < 20) return asset;

            const signal = evaluateMonoridSignal(asset.symbol, candles, 10, 3.0, settingsRef.current.swingLookbackBars);
            const pmax = calculatePMax(candles, 10, 3.0, 10);
            const lastPMax = pmax[pmax.length - 1];

            const realSignalStatus: AssetScanningState['signalStatus'] =
              signal.finalDecision === 'EXECUTE_LONG' ? 'CONFIRMED_BUY' :
              signal.finalDecision === 'EXECUTE_SHORT' ? 'CONFIRMED_SELL' :
              (signal.pmaxSignal === 'BUY' ? 'READY_BUY' : signal.pmaxSignal === 'SELL' ? 'READY_SELL' : 'NEUTRAL');

            const pmaxSignalVal: 'BUY' | 'SELL' | 'HOLD' = signal.pmaxSignal === 'BUY' ? 'BUY' : signal.pmaxSignal === 'SELL' ? 'SELL' : 'HOLD';
            const latestPrice = candles[candles.length - 1]?.close || asset.currentPrice;

            return {
              ...asset,
              currentPrice: latestPrice,
              pmaxDir: lastPMax?.dir || asset.pmaxDir,
              pmaxMAvg: lastPMax?.mAvg || asset.pmaxMAvg,
              pmaxLine: lastPMax?.pMax || asset.pmaxLine,
              pmaxSignal: pmaxSignalVal,
              proScalperOsc: signal.proScalperOsc,
              proScalperConfirmed: signal.finalDecision === 'EXECUTE_LONG' || signal.finalDecision === 'EXECUTE_SHORT',
              signalStatus: realSignalStatus,
              swingLow: signal.swingLow,
              swingHigh: signal.swingHigh
            };
          });
          return { ...cat, assets: nextAssets };
        });
      });
    } catch {}
  };

  // Initial & Periodic Data Polling
  useEffect(() => {
    syncRealTickers();
    syncRotatingKlines(true);
    const tickerInterval = setInterval(syncRealTickers, 20000);
    const klinesInterval = setInterval(() => syncRotatingKlines(false), 12000);
    return () => {
      clearInterval(tickerInterval);
      clearInterval(klinesInterval);
    };
  }, []);

  useEffect(() => {
    if (settings.apiKey && settings.apiSecret) {
      syncAccountData(settings.apiKey, settings.apiSecret);
      syncTradeHistory(settings.apiKey, settings.apiSecret);

      const accInterval = setInterval(() => {
        syncAccountData(settings.apiKey, settings.apiSecret);
        syncTradeHistory(settings.apiKey, settings.apiSecret);
      }, 10000);

      return () => clearInterval(accInterval);
    }
  }, [settings.apiKey, settings.apiSecret]);

  // 5. Connect Real Live Binance WebSocket Feed
  useEffect(() => {
    const wsClient = getBinanceWsClient();
    const unsubStatus = wsClient.onStatusChange(status => setWsStatus(status));

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

  // 6. Handle Live WebSocket Ticker Updates
  const handleLiveTickerUpdate = (ticker: TickerUpdate) => {
    // Update live open positions with mark price
    setPositions(prev => {
      let changed = false;
      const updated = prev.map(pos => {
        if (pos.symbol === ticker.symbol) {
          changed = true;
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
            netPnl: pnlCalc.netPnl,
            netPnlPercent: pnlCalc.netPnlPercent
          };
        }
        return pos;
      });
      return changed ? updated : prev;
    });

    // Update scanner assets
    setCategories(prevCats => {
      let changed = false;
      const nextCats = prevCats.map(cat => {
        let catChanged = false;
        const nextAssets = cat.assets.map(asset => {
          if (asset.symbol === ticker.symbol) {
            catChanged = true;
            changed = true;
            const price = ticker.price || asset.currentPrice;
            const change24h = ticker.change24h || asset.change24h;
            const volume24h = ticker.volume24h || asset.volume24h;
            const qual = checkAssetQualification({ volume24h, change24h, price });

            return {
              ...asset,
              currentPrice: price,
              change24h,
              volume24h,
              isQualified: qual.isQualified,
              disqualificationReason: qual.reason
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

  // 7. Real Trade Execution on Binance USDT-M Futures
  const executeTrade = async (symbol: string, category: string, side: 'LONG' | 'SHORT'): Promise<boolean> => {
    // Evaluate trade sizing against free available margin so we do not over-allocate committed margin
    const curBalance = availableBalanceRef.current > 0
      ? availableBalanceRef.current
      : (positionsRef.current.length === 0 ? currentBalanceRef.current : 0);

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
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }

    if (positionsRef.current.length >= settingsRef.current.maxOpenPositions) {
      addLog(
        'EXECUTION',
        'WARNING',
        `Trade order for ${symbol} rejected: Maximum open positions limit (${settingsRef.current.maxOpenPositions}) reached.`,
        symbol,
        category
      );
      return false;
    }

    if (positionsRef.current.some(p => p.symbol === symbol)) {
      return false;
    }

    // Fetch latest real 5m candles from Binance to guarantee live indicator accuracy
    let candles = getCandlesForSymbol(symbol);
    try {
      const klinesRes = await fetch(`/api/binance/klines?symbol=${symbol}&interval=5m&limit=60`);
      if (klinesRes.ok) {
        const klinesData = await klinesRes.json();
        if (klinesData.success && Array.isArray(klinesData.klines) && klinesData.klines.length >= 20) {
          setCandlesForSymbol(symbol, klinesData.klines);
          candles = klinesData.klines;
        }
      }
    } catch {}

    const signal = evaluateMonoridSignal(symbol, candles, 10, 3.0, settingsRef.current.swingLookbackBars);

    // Synchronize asset state in categories with live indicator evaluation
    const realSignalStatus: AssetScanningState['signalStatus'] =
      signal.finalDecision === 'EXECUTE_LONG' ? 'CONFIRMED_BUY' :
      signal.finalDecision === 'EXECUTE_SHORT' ? 'CONFIRMED_SELL' :
      (signal.pmaxSignal === 'BUY' ? 'READY_BUY' : signal.pmaxSignal === 'SELL' ? 'READY_SELL' : 'NEUTRAL');

    setCategories(prevCats => prevCats.map(cat => ({
      ...cat,
      assets: cat.assets.map(a => a.symbol === symbol ? {
        ...a,
        signalStatus: realSignalStatus,
        proScalperConfirmed: signal.finalDecision === 'EXECUTE_LONG' || signal.finalDecision === 'EXECUTE_SHORT',
        proScalperOsc: signal.proScalperOsc,
        pmaxSignal: signal.pmaxSignal === 'BUY' ? 'BUY' : signal.pmaxSignal === 'SELL' ? 'SELL' : 'HOLD',
        swingLow: signal.swingLow,
        swingHigh: signal.swingHigh
      } : a)
    })));

    // Requirement: "Both indicators must agree: PMax triggers the primary signal direction, and Pro Scalper AI provides the confirmed filter/confirmation before opening real Binance USDT-M Futures orders."
    if (side === 'LONG' && signal.finalDecision !== 'EXECUTE_LONG') {
      addLog('EXECUTION', 'INFO', `Signal rejected for ${symbol}: ${signal.reason}`, symbol, category);
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }
    if (side === 'SHORT' && signal.finalDecision !== 'EXECUTE_SHORT') {
      addLog('EXECUTION', 'INFO', `Signal rejected for ${symbol}: ${signal.reason}`, symbol, category);
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }

    const isBuyExpected = side === 'LONG';
    const currentPrice = candles[candles.length - 1].close;
    const swings = getRecentSwingLevels(candles, settingsRef.current.swingLookbackBars);

    // Requirement: "Best signal use 15x or good signal use 10x leverage."
    const signalEval = evaluateSignalStrength(side, signal.proScalperOsc, 25, signal.isStrong);
    const leverage = signalEval.leverage;
    const signalStrength = signalEval.strength;

    let stopLoss = 0;
    let takeProfit = 0;

    if (isBuyExpected) {
      stopLoss = Math.min(swings.swingLow, currentPrice * 0.992);
      const risk = currentPrice - stopLoss;
      // 1:2 Risk to Reward Take Profit
      takeProfit = currentPrice + 2 * risk;
    } else {
      stopLoss = Math.max(swings.swingHigh, currentPrice * 1.008);
      const risk = stopLoss - currentPrice;
      // 1:2 Risk to Reward Take Profit
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
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }

    // Binance Minimum Notional Handling & Margin Allocation
    const usableTradingBalance = Math.max(0, curBalance - 1.20);
    let margin = marginAllocation.margin;

    if (symbol === 'BTCUSDT') {
      const minMarginReq = 50.05 / leverage; // Binance BTCUSDT requires $50.00 min notional
      if (usableTradingBalance < minMarginReq) {
        addLog(
          'EXECUTION',
          'INFO',
          `Skipping ${symbol}: Binance requires $50.00 min notional ($${minMarginReq.toFixed(2)} margin at ${leverage}x), but usable balance is $${usableTradingBalance.toFixed(2)}. Proceeding to other pairs...`,
          symbol,
          category
        );
        rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
        return false;
      }
      margin = Math.max(margin, minMarginReq);
    } else if (symbol === 'ETHUSDT') {
      const minMarginReq = 20.05 / leverage; // Binance ETHUSDT requires $20.00 min notional
      if (usableTradingBalance < minMarginReq) {
        addLog(
          'EXECUTION',
          'INFO',
          `Skipping ${symbol}: Binance requires $20.00 min notional ($${minMarginReq.toFixed(2)} margin at ${leverage}x), but usable balance is $${usableTradingBalance.toFixed(2)}. Proceeding to other pairs...`,
          symbol,
          category
        );
        rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
        return false;
      }
      margin = Math.max(margin, minMarginReq);
    } else {
      // Altcoin pairs requiring $5 min notional
      const minNotionalTarget = 5.05;
      const minMarginFor5Notional = minNotionalTarget / leverage;

      if (margin * leverage < 5.0) {
        if (usableTradingBalance >= 0.55) {
          margin = Math.max(margin, Math.min(usableTradingBalance, minMarginFor5Notional));
        } else if (usableTradingBalance >= minMarginFor5Notional) {
          margin = minMarginFor5Notional;
        } else {
          addLog(
            'EXECUTION',
            'INFO',
            `Skipping ${symbol}: Usable balance ($${usableTradingBalance.toFixed(2)}) is insufficient for $5.00 min notional ($${minMarginFor5Notional.toFixed(2)} margin at ${leverage}x).`,
            symbol,
            category
          );
          rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
          return false;
        }
      }
    }

    // Ensure margin does not exceed usable balance
    margin = Math.min(margin, usableTradingBalance);

    // Check if Binance API credentials are configured for real order submission
    if (!settingsRef.current.apiKey || !settingsRef.current.apiSecret) {
      addLog(
        'EXECUTION',
        'WARNING',
        `[BINANCE API REQUIRED] Confirmed ${side} signal on ${symbol} ready for execution, but Binance Futures API Key is missing. Configure API keys in Settings to execute real trades.`,
        symbol,
        category
      );
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }

    // Execute Real Order via Signed Binance Futures API Route
    try {
      addLog(
        'EXECUTION',
        'INFO',
        `Submitting real ${side} order to Binance Futures for ${symbol} with ${leverage}x leverage and $${margin.toFixed(2)} margin...`,
        symbol,
        category
      );

      const orderRes = await fetch('/api/binance/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-binance-api-key': settingsRef.current.apiKey,
          'x-binance-api-secret': settingsRef.current.apiSecret
        },
        body: JSON.stringify({
          symbol,
          side,
          margin,
          leverage,
          stopLoss,
          takeProfit
        })
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Binance order submission rejected');
      }

      const trade = orderData.trade;
      const executedPrice = trade.executedPrice || currentPrice;
      const quantity = trade.quantity;
      const actualMargin = trade.margin || margin;

      const newPosition: Position = {
        id: `pos-${trade.entryOrderId || Date.now()}`,
        symbol,
        category,
        side,
        entryPrice: executedPrice,
        currentPrice: executedPrice,
        markPrice: executedPrice,
        quantity,
        leverage,
        signalStrength,
        margin: actualMargin,
        entryTime: Date.now(),
        stopLoss: trade.stopLoss || stopLoss,
        takeProfit: trade.takeProfit || takeProfit,
        liquidationPrice,
        recentSwingPrice: isBuyExpected ? swings.swingLow : swings.swingHigh,
        grossPnl: 0,
        feesPaid: actualMargin * leverage * settingsRef.current.takerFeeRate,
        netPnl: -(actualMargin * leverage * settingsRef.current.takerFeeRate),
        netPnlPercent: -settingsRef.current.takerFeeRate * leverage * 100,
        status: 'OPEN',
        binanceOrderId: trade.entryOrderId,
        stopLossOrderId: trade.stopLossOrderId,
        takeProfitOrderId: trade.takeProfitOrderId
      };

      setPositions(prev => [newPosition, ...prev.filter(p => p.symbol !== symbol)]);

      addLog(
        'EXECUTION',
        'SUCCESS',
        `[BINANCE LIVE FILLS] Real ${side} order executed for ${symbol} @ ${executedPrice.toFixed(4)}. Order ID: ${trade.entryOrderId}. Leverage: ${leverage}x (${signalStrength}). Margin: ${actualMargin.toFixed(2)}. SL: ${trade.stopLoss} (Swing ${isBuyExpected ? 'Low' : 'High'}), Liq: ${liquidationPrice.toFixed(4)} (Shield Active), TP: ${trade.takeProfit} (1:2 RR).`,
        symbol,
        category
      );

      if (trade.stopLossError) {
        addLog(
          'EXECUTION',
          'WARNING',
          `[STOP LOSS WARNING] Primary order placed but Stop Loss order was rejected by Binance for ${symbol}: ${trade.stopLossError}`,
          symbol,
          category
        );
      }
      if (trade.takeProfitError) {
        addLog(
          'EXECUTION',
          'WARNING',
          `[TAKE PROFIT WARNING] Primary order placed but Take Profit order was rejected by Binance for ${symbol}: ${trade.takeProfitError}`,
          symbol,
          category
        );
      }

      // Re-sync wallet balance after order fill
      syncAccountData(settingsRef.current.apiKey, settingsRef.current.apiSecret);
      return true;
    } catch (err: any) {
      addLog(
        'EXECUTION',
        'ERROR',
        `Real trade execution failed on Binance for ${symbol}: ${err?.message || err}`,
        symbol,
        category
      );
      rejectedSymbolsCooldownRef.current.set(symbol, Date.now());
      return false;
    }
  };

  // 8. Emergency Market Close
  const handleEmergencyClose = async (symbol: string) => {
    if (!settings.apiKey || !settings.apiSecret) {
      setPositions(prev => prev.filter(p => p.symbol !== symbol));
      return;
    }

    try {
      addLog('EXECUTION', 'INFO', `Closing position for ${symbol} on Binance Futures...`, symbol);
      const res = await fetch('/api/binance/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-binance-api-key': settings.apiKey,
          'x-binance-api-secret': settings.apiSecret
        },
        body: JSON.stringify({ symbol })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPositions(prev => prev.filter(p => p.symbol !== symbol));
        addLog('EXECUTION', 'SUCCESS', `Successfully closed ${symbol} position on Binance Futures.`, symbol);
        syncAccountData(settings.apiKey, settings.apiSecret);
        syncTradeHistory(settings.apiKey, settings.apiSecret);
      } else {
        throw new Error(data.message || 'Close failed');
      }
    } catch (err: any) {
      addLog('EXECUTION', 'ERROR', `Failed to close ${symbol}: ${err?.message || err}`, symbol);
    }
  };

  const handleProtectPosition = async (symbol: string, customStopLoss?: number, customTakeProfit?: number) => {
    if (inFlightProtectRef.current.has(symbol)) return;
    inFlightProtectRef.current.add(symbol);
    lastProtectAttemptRef.current.set(symbol, Date.now());
    setProtectingSymbols(prev => Array.from(new Set([...prev, symbol])));

    try {
      addLog('TP_SL', 'INFO', `Placing protective 1:2 RR Take Profit and Stop Loss for ${symbol} on Binance Futures...`, symbol);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.apiKey) headers['x-binance-api-key'] = settings.apiKey;
      if (settings.apiSecret) headers['x-binance-api-secret'] = settings.apiSecret;

      const res = await fetch('/api/binance/tpsl', {
        method: 'POST',
        headers,
        body: JSON.stringify({ symbol, stopLoss: customStopLoss, takeProfit: customTakeProfit })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place TP/SL');
      }

      setPositions(prev => prev.map(p => {
        if (p.symbol === symbol) {
          return {
            ...p,
            stopLoss: data.stopLoss || p.stopLoss,
            takeProfit: data.takeProfit || p.takeProfit,
            stopLossOrderId: data.stopLossOrderId || p.stopLossOrderId,
            takeProfitOrderId: data.takeProfitOrderId || p.takeProfitOrderId
          };
        }
        return p;
      }));

      addLog(
        'TP_SL',
        'SUCCESS',
        `[SHIELD ACTIVE] Stop Loss set at $${data.stopLoss} and Take Profit set at $${data.takeProfit} (1:2 RR) for ${symbol}!`,
        symbol
      );
      syncAccountData(settings.apiKey, settings.apiSecret);
    } catch (err: any) {
      addLog(
        'TP_SL',
        'ERROR',
        `Failed to set TP/SL for ${symbol}: ${err?.message || err}. Ensure Binance API Key has "Enable Futures" enabled and IP ${userIp || '108.131.84.219'} whitelisted.`,
        symbol
      );
    } finally {
      inFlightProtectRef.current.delete(symbol);
      setProtectingSymbols(prev => prev.filter(s => s !== symbol));
    }
  };

  const handleProtectAllPositions = async () => {
    if (isProtectingAll) return;
    setIsProtectingAll(true);
    addLog('TP_SL', 'INFO', 'Shielding all active running trades on Binance with 1:2 RR TP/SL...');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.apiKey) headers['x-binance-api-key'] = settings.apiKey;
      if (settings.apiSecret) headers['x-binance-api-secret'] = settings.apiSecret;

      const res = await fetch('/api/binance/tpsl', {
        method: 'POST',
        headers,
        body: JSON.stringify({ protectAll: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(
          'TP_SL',
          'SUCCESS',
          `[SHIELD ALL COMPLETE] Protected ${data.protectedCount || 0} of ${data.totalPositions || 0} running trades with 1:2 RR TP/SL!`
        );
        syncAccountData(settings.apiKey, settings.apiSecret);
      } else {
        throw new Error(data.message || 'Protect all failed');
      }
    } catch (err: any) {
      addLog('TP_SL', 'ERROR', `Failed to protect all positions: ${err?.message || err}`);
    } finally {
      setIsProtectingAll(false);
    }
  };

  useEffect(() => {
    handleProtectPositionRef.current = handleProtectPosition;
  });

  // 9. Autonomous Bot Strategy Loop
  const executeTradeRef = useRef(executeTrade);
  useEffect(() => {
    executeTradeRef.current = executeTrade;
  });

  useEffect(() => {
    if (!settings.autoTradingEnabled) return;

    let lastCapacityLog = 0;
    const interval = setInterval(async () => {
      const openSymbols = new Set(positionsRef.current.map(p => p.symbol));
      const maxPositions = settingsRef.current.maxOpenPositions || 10;
      if (openSymbols.size >= maxPositions) {
        const now = Date.now();
        if (now - lastCapacityLog > 60000) {
          addLog(
            'EXECUTION',
            'INFO',
            `Max position capacity reached: ${openSymbols.size}/${maxPositions} trades running. Free usable balance is reserved; waiting for a trade to hit TP or SL before opening new positions.`
          );
          lastCapacityLog = now;
        }
        return;
      }

      const currentCats = categoriesRef.current;
      const totalCats = currentCats.length;
      if (totalCats === 0) return;
      const startCatIdx = lastCategoryIndexRef.current % totalCats;

      for (let c = 0; c < totalCats; c++) {
        const currentCatIdx = (startCatIdx + c) % totalCats;
        const cat = currentCats[currentCatIdx];

        for (const asset of cat.assets) {
          if (openSymbols.has(asset.symbol)) continue;

          // Enforce volume & volatility qualification
          if (!asset.isQualified) continue;

          // Skip symbols in 60s cooldown from rejected execution or signal mismatch
          const lastRejected = rejectedSymbolsCooldownRef.current.get(asset.symbol) || 0;
          if (Date.now() - lastRejected < 60000) continue;

          if (asset.signalStatus === 'CONFIRMED_BUY') {
            lastCategoryIndexRef.current = (currentCatIdx + 1) % totalCats;
            const executed = await executeTradeRef.current(asset.symbol, cat.id, 'LONG');
            if (executed) {
              return; // Trade placed successfully, finish tick
            }
          } else if (asset.signalStatus === 'CONFIRMED_SELL') {
            lastCategoryIndexRef.current = (currentCatIdx + 1) % totalCats;
            const executed = await executeTradeRef.current(asset.symbol, cat.id, 'SHORT');
            if (executed) {
              return; // Trade placed successfully, finish tick
            }
          }
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [settings.autoTradingEnabled]);

  // Actual Realized & Unrealized PnL based on live balance benchmark
  const actualProfitDollar = liveStartingBalance > 0 ? liveCurrentBalance - liveStartingBalance : 0;
  const actualProfitPercent = liveStartingBalance > 0 ? (actualProfitDollar / liveStartingBalance) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wsStatus={wsStatus}
        userIp={userIp}
        startingBalance={liveStartingBalance}
        currentBalance={liveCurrentBalance}
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
            startingBalance={liveStartingBalance}
            currentBalance={liveCurrentBalance}
            availableBalance={liveAvailableBalance}
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
            onClosePosition={handleEmergencyClose}
            onProtectPosition={handleProtectPosition}
            onProtectAllPositions={handleProtectAllPositions}
            isProtectingAll={isProtectingAll}
            protectingSymbols={protectingSymbols}
            autoShieldEnabled={settings.autoShieldEnabled !== false}
            onToggleAutoShield={() => {
              const nextState = settings.autoShieldEnabled === false ? true : false;
              setSettings(s => ({ ...s, autoShieldEnabled: nextState }));
              addLog('SYSTEM', 'INFO', `Auto-Shield running trade protection ${nextState ? 'ENABLED' : 'DISABLED'}.`);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAnalyticsView
            closedTrades={closedTrades}
            sessionStartTime={sessionStartTime}
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
            settings={{
              ...settings,
              startingBalance: liveStartingBalance,
              currentBalance: liveCurrentBalance,
              availableBalance: liveAvailableBalance
            }}
            userIp={userIp}
            onSaveSettings={(newSettings) => {
              const maxPos = newSettings.maxOpenPositions && newSettings.maxOpenPositions > 0
                ? newSettings.maxOpenPositions
                : settings.maxOpenPositions;

              setSettings(prev => ({
                ...prev,
                apiKey: newSettings.apiKey,
                apiSecret: newSettings.apiSecret,
                autoShieldEnabled: newSettings.autoShieldEnabled !== false,
                isLiveTrading: true,
                maxOpenPositions: maxPos,
              }));

              try {
                localStorage.setItem('monorid_binance_api_key', newSettings.apiKey);
                localStorage.setItem('monorid_binance_api_secret', newSettings.apiSecret);
                localStorage.setItem('monorid_binance_max_positions', String(maxPos));
              } catch {}

              addLog('SYSTEM', 'SUCCESS', `Binance Futures API credentials and settings saved successfully. Max Open Positions set to ${maxPos}. Testing live connection and fetching balances...`);
              syncAccountData(newSettings.apiKey, newSettings.apiSecret);
              syncTradeHistory(newSettings.apiKey, newSettings.apiSecret);
            }}
            onTestApiConnection={async () => {
              const res = await fetch('/api/binance/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  apiKey: settings.apiKey,
                  apiSecret: settings.apiSecret
                })
              });
              const data = await res.json();
              return data.success === true;
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 font-mono text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <MiroStyleLogo size="xs" animated={true} />
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
