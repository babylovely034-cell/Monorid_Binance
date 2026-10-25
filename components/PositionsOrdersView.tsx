'use client';

import React from 'react';
import { Position } from '@/lib/types';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  XOctagon, 
  Crosshair, 
  Percent,
  Check
} from 'lucide-react';

interface PositionsOrdersViewProps {
  positions: Position[];
}

export default function PositionsOrdersView({
  positions,
}: PositionsOrdersViewProps) {
  const totalNetPnl = positions.reduce((sum, p) => sum + p.netPnl, 0);
  const totalGrossPnl = positions.reduce((sum, p) => sum + p.grossPnl, 0);
  const totalFees = positions.reduce((sum, p) => sum + p.feesPaid, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Automated Mode Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Live Positions & Risk Target Orders</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Binance USDT-M Futures position engine with automated Swing Stop Loss and 1:2 RR Take Profit.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% AUTOMATIC EXIT ONLY</span>
            </div>
          </div>
        </div>

        {/* Aggregated PnL Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[11px]">ACTIVE POSITIONS</span>
            <span className="text-base font-bold text-white">{positions.length} Open</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">GROSS PNL</span>
            <span className={`text-base font-bold ${totalGrossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalGrossPnl >= 0 ? '+' : ''}${totalGrossPnl.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">BINANCE FEES PAID</span>
            <span className="text-base font-bold text-amber-400">
              -${totalFees.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">NET PNL (AFTER FEES)</span>
            <span className={`text-base font-bold ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Active Contracts</h3>
          <span className="text-xs text-slate-400 font-mono">Real-time WebSocket Mark Price</span>
        </div>

        {positions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Crosshair className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Active Positions</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The automated bot is scanning 10 categories for confirmed PMax + Pro Scalper AI signals on the 5m timeframe.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-4">Symbol / Signal</th>
                  <th className="py-3 px-4 text-right">Size / Margin (10%)</th>
                  <th className="py-3 px-4 text-right">Entry Price</th>
                  <th className="py-3 px-4 text-right">Mark Price</th>
                  <th className="py-3 px-4 text-right text-rose-400">Swing SL</th>
                  <th className="py-3 px-4 text-right text-purple-400">Liq Price</th>
                  <th className="py-3 px-4 text-right text-emerald-400">1:2 RR TP</th>
                  <th className="py-3 px-4 text-right">Fees Paid</th>
                  <th className="py-3 px-4 text-right text-amber-300">Net PnL (After Fees)</th>
                  <th className="py-3 px-4 text-right">Exit Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positions.map((pos) => {
                  const isLong = pos.side === 'LONG';
                  const distToSL = Math.abs(pos.currentPrice - pos.stopLoss) / pos.currentPrice * 100;
                  const distToTP = Math.abs(pos.takeProfit - pos.currentPrice) / pos.currentPrice * 100;
                  const distToLiq = pos.liquidationPrice > 0 ? Math.abs(pos.currentPrice - pos.liquidationPrice) / pos.currentPrice * 100 : 0;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Symbol / Side / Strength */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">
                            {pos.symbol}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {pos.side} {pos.leverage}x
                          </span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                            pos.signalStrength === 'BEST' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {pos.signalStrength || (pos.leverage === 15 ? 'BEST' : 'GOOD')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Entered {new Date(pos.entryTime).toLocaleTimeString()}
                        </span>
                      </td>

                      {/* Size / Margin (10% balance) */}
                      <td className="py-3 px-4 text-right">
                        <div className="text-white font-medium">
                          ${(pos.entryPrice * pos.quantity).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Margin: ${pos.margin.toFixed(2)} (10%)
                        </div>
                      </td>

                      {/* Entry Price */}
                      <td className="py-3 px-4 text-right text-slate-300">
                        ${pos.entryPrice.toFixed(4)}
                      </td>

                      {/* Mark Price */}
                      <td className="py-3 px-4 text-right text-white font-bold">
                        ${pos.currentPrice.toFixed(4)}
                      </td>

                      {/* Stop Loss (Swing Level) */}
                      <td className="py-3 px-4 text-right text-rose-400 font-semibold">
                        <div>${pos.stopLoss.toFixed(4)}</div>
                        <div className="text-[9px] text-slate-500">{distToSL.toFixed(2)}% away</div>
                      </td>

                      {/* Liquidation Price */}
                      <td className="py-3 px-4 text-right text-purple-400 font-mono">
                        <div>${pos.liquidationPrice > 0 ? pos.liquidationPrice.toFixed(4) : '--'}</div>
                        <div className="text-[9px] text-slate-500">{distToLiq.toFixed(2)}% away</div>
                      </td>

                      {/* Take Profit (1:2 RR Target) */}
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                        <div>${pos.takeProfit.toFixed(4)}</div>
                        <div className="text-[9px] text-slate-500">{distToTP.toFixed(2)}% away</div>
                      </td>

                      {/* Platform Fees */}
                      <td className="py-3 px-4 text-right text-slate-400">
                        -${pos.feesPaid.toFixed(3)}
                      </td>

                      {/* Net PnL After Fees */}
                      <td className="py-3 px-4 text-right">
                        <div className={`text-sm font-bold ${pos.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.netPnl >= 0 ? '+' : ''}${pos.netPnl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] font-bold ${pos.netPnlPercent >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {pos.netPnlPercent >= 0 ? '+' : ''}{pos.netPnlPercent.toFixed(2)}% ROI
                        </div>
                      </td>

                      {/* Action / Exit Mode */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            AUTO TP (1:2) / SL
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Automated Exit Only
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
