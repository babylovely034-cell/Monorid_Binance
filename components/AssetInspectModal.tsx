'use client';

import React from 'react';
import { AssetScanningState } from '@/lib/types';
import { getCandlesForSymbol } from '@/lib/scannerData';
import { calculatePMax, calculateProScalperAI } from '@/lib/indicators';
import { X, TrendingUp, TrendingDown, ShieldCheck, Zap, Crosshair } from 'lucide-react';

interface AssetInspectModalProps {
  asset: AssetScanningState | null;
  onClose: () => void;
}

export default function AssetInspectModal({
  asset,
  onClose,
}: AssetInspectModalProps) {
  const [candles, setCandles] = React.useState<any[]>(() => asset ? getCandlesForSymbol(asset.symbol) : []);
  const [loadingKlines, setLoadingKlines] = React.useState(false);

  React.useEffect(() => {
    if (!asset?.symbol) return;
    let isMounted = true;
    setLoadingKlines(true);

    fetch(`/api/binance/klines?symbol=${asset.symbol}&interval=5m&limit=60`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.klines) && data.klines.length >= 20) {
          setCandles(data.klines);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingKlines(false);
      });

    return () => { isMounted = false; };
  }, [asset?.symbol]);

  if (!asset) return null;

  const pmaxData = calculatePMax(candles, 10, 3.0, 10);
  const proScalperData = calculateProScalperAI(candles);

  const lastPMax = pmaxData[pmaxData.length - 1];
  const lastScalper = proScalperData[proScalperData.length - 1];

  const isLong = lastPMax?.dir === 1;
  const isOscAboveZero = lastScalper?.oscillator > 0;
  const isConfirmed = (isLong && (lastScalper?.condStrongBuy || isOscAboveZero)) ||
                      (!isLong && (lastScalper?.condStrongSell || !isOscAboveZero));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white font-mono">{asset.symbol}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${
              asset.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}% (24h)
            </span>
            <span className="text-xs text-slate-400 font-mono">5-Minute TF</span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto font-mono text-xs">
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MARK PRICE</span>
              <span className="text-sm font-bold text-white">${asset.currentPrice.toFixed(4)}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">TREND STATUS</span>
              <span className={`text-sm font-bold ${isLong ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isLong ? 'BULLISH (LONG)' : 'BEARISH (SHORT)'}
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">MOMENTUM OSC</span>
              <span className={`text-sm font-bold ${isOscAboveZero ? 'text-emerald-400' : 'text-rose-400'}`}>
                {lastScalper.oscillator > 0 ? '+' : ''}{lastScalper.oscillator.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ZERO LINE GATE</span>
              <span className={`text-sm font-bold ${isOscAboveZero ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isOscAboveZero ? '> 0 (CONFIRMS BUY)' : '< 0 (CONFIRMS SELL)'}
              </span>
            </div>
          </div>

          {/* Strategy Confirmation Logic Checklist */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2.5">
            <span className="font-bold text-white block text-sm">
              Execution Confirmation Criteria (Dual-Engine Rules)
            </span>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between">
                <span>1. Primary Trend Direction:</span>
                <span className={`font-bold ${isLong ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isLong ? 'BUY Bias (MAvg > PMax)' : 'SELL Bias (MAvg < PMax)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Composite Momentum Zero Line:</span>
                <span className={`font-bold ${isOscAboveZero ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isOscAboveZero ? 'Oscillator Above 0 (+ ' + lastScalper.oscillator.toFixed(1) + ')' : 'Oscillator Below 0 (' + lastScalper.oscillator.toFixed(1) + ')'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Confirmation Match (&quot;No confirmation no trade&quot;):</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  isConfirmed 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {isConfirmed ? 'CONFIRMED MATCH' : 'REJECTED / UNCONFIRMED'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Recent Swing Low (Long SL):</span>
                <span className="text-rose-400 font-bold">${asset.swingLow.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recent Swing High (Short SL):</span>
                <span className="text-rose-400 font-bold">${asset.swingHigh.toFixed(4)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Calculated 1:2 Risk to Reward Take Profit:</span>
                <span className="text-emerald-400 font-bold">
                  ${(isLong 
                    ? asset.currentPrice + 2 * Math.max(asset.currentPrice - asset.swingLow, asset.currentPrice * 0.005)
                    : asset.currentPrice - 2 * Math.max(asset.swingHigh - asset.currentPrice, asset.currentPrice * 0.005)
                  ).toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              100% Autonomous Execution (No Manual Trades)
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
