import { updateSymbolPrice } from './scannerData';

export type WsConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FALLBACK_SIMULATED' | 'DISCONNECTED';

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
  private simulationInterval: any = null;
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

  public connect(symbols: string[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']) {
    if (typeof window === 'undefined') return;
    this.isDestroyed = false;
    symbols.forEach(s => this.subscribedSymbols.add(s.toUpperCase()));

    this.setStatus('CONNECTING');

    try {
      // Connect to Binance Futures all market mini-ticker stream
      const wsUrl = 'wss://fstream.binance.com/ws/!miniTicker@arr';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.stopSimulation();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (Array.isArray(data)) {
            // !miniTicker@arr message
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

      this.ws.onerror = (err) => {
        // Fallback to active simulation if remote WS is blocked or restricted by container network
        if (this.status !== 'CONNECTED') {
          this.fallbackToSimulation();
        }
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) {
          if (this.reconnectAttempts < 3) {
            this.setStatus('RECONNECTING');
            this.reconnectAttempts++;
            setTimeout(() => this.connect(Array.from(this.subscribedSymbols)), 3000);
          } else {
            this.fallbackToSimulation();
          }
        }
      };
    } catch (e) {
      this.fallbackToSimulation();
    }
  }

  private fallbackToSimulation() {
    this.setStatus('FALLBACK_SIMULATED');
    this.startSimulation();
  }

  private startSimulation() {
    if (this.simulationInterval) return;

    const baseSymbols = [
      'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'PEPEUSDT', 'WIFUSDT',
      'FETUSDT', 'RENDERUSDT', 'TAOUSDT', 'SUIUSDT', 'ARBUSDT', 'UNIUSDT', 'NEARUSDT'
    ];

    this.simulationInterval = setInterval(() => {
      const randomSym = baseSymbols[Math.floor(Math.random() * baseSymbols.length)];
      // Random micro-tick +/- 0.08%
      const deltaPercent = (Math.random() - 0.495) * 0.0016;
      
      // Update memory store
      const symbolStore = updateSymbolPrice(randomSym, 0, 50); // placeholder fetch
      const currentPrice = symbolStore.close * (1 + deltaPercent);
      updateSymbolPrice(randomSym, currentPrice, 250);

      const update: TickerUpdate = {
        symbol: randomSym,
        price: currentPrice,
        change24h: ((Math.random() - 0.4) * 14),
        volume24h: 120000000 + Math.random() * 50000000,
        timestamp: Date.now()
      };
      this.listeners.forEach(fn => fn(update));
    }, 1200);
  }

  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    this.stopSimulation();
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

// Singleton instance
let clientInstance: BinanceFuturesWebSocketClient | null = null;
export function getBinanceWsClient(): BinanceFuturesWebSocketClient {
  if (!clientInstance) {
    clientInstance = new BinanceFuturesWebSocketClient();
  }
  return clientInstance;
}
