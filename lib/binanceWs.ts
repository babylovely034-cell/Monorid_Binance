/**
 * Monorid Proprietary Quantitative Trading Engine
 * Binance USDT-M Futures Real-Time WebSocket Client
 * Copyright (c) 2026 Trading Lifestyle Quant. All rights reserved.
 * Strictly proprietary and confidential.
 */

import { updateSymbolPrice } from './scannerData';

export type WsConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export interface TickerUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

export class BinanceFuturesWebSocketClient {
  private ws: WebSocket | null = null;
  private status: WsConnectionStatus = 'DISCONNECTED';
  private listeners: Set<(ticker: TickerUpdate) => void> = new Set();
  private statusListeners: Set<(status: WsConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private subscribedSymbols: Set<string> = new Set();
  private isDestroyed = false;

  constructor() {}

  public getStatus(): WsConnectionStatus {
    return this.status;
  }

  public subscribe(listener: (ticker: TickerUpdate) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onStatusChange(listener: (status: WsConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: WsConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach(fn => fn(status));
  }

  public connect(symbols: string[] = []) {
    if (typeof window === 'undefined') return;
    this.isDestroyed = false;
    symbols.forEach(s => this.subscribedSymbols.add(s.toUpperCase()));

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    try {
      // Connect directly to live Binance USDT-M Futures mini-ticker stream
      const wsUrl = 'wss://fstream.binance.com/ws/!miniTicker@arr';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            // !miniTicker@arr message from live Binance Futures
            for (const item of data) {
              const sym = item.s;
              if (sym && (this.subscribedSymbols.size === 0 || this.subscribedSymbols.has(sym))) {
                const price = parseFloat(item.c);
                const open = parseFloat(item.o);
                const volume = parseFloat(item.q);
                const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

                updateSymbolPrice(sym, price, 100);

                const update: TickerUpdate = {
                  symbol: sym,
                  price,
                  change24h,
                  volume24h: volume,
                  timestamp: item.E || Date.now()
                };
                this.listeners.forEach(fn => fn(update));
              }
            }
          }
        } catch (e) {
          // Parsing failure
        }
      };

      this.ws.onerror = () => {
        // Handle error gracefully - will trigger onclose for automatic reconnection
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          this.setStatus('RECONNECTING');
          this.reconnectAttempts++;
          // Exponential backoff: 2s, 4s, 8s, max 15s
          const delay = Math.min(1000 * Math.pow(2, Math.min(this.reconnectAttempts, 4)), 15000);
          this.reconnectTimer = setTimeout(() => {
            this.connect(Array.from(this.subscribedSymbols));
          }, delay);
        } else {
          this.setStatus('DISCONNECTED');
        }
      };
    } catch (e) {
      if (!this.isDestroyed) {
        this.setStatus('RECONNECTING');
        this.reconnectTimer = setTimeout(() => {
          this.connect(Array.from(this.subscribedSymbols));
        }, 5000);
      }
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

// Global Singleton for application lifetime
let globalBinanceWsClient: BinanceFuturesWebSocketClient | null = null;

export function getBinanceWsClient(): BinanceFuturesWebSocketClient {
  if (!globalBinanceWsClient) {
    globalBinanceWsClient = new BinanceFuturesWebSocketClient();
  }
  return globalBinanceWsClient;
}
