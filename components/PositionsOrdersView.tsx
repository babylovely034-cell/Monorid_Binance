'use client';

import React, { useState } from 'react';
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
  Check,
  Sliders,
  X,
  ExternalLink
} from 'lucide-react';

interface PositionsOrdersViewProps {
  positions: Position[];
  onClosePosition?: (symbol: string) => void;
  onProtectPosition?: (symbol: string, customStopLoss?: number, customTakeProfit?: number) => Promise<void> | void;
  onProtectAllPositions?: () => Promise<void> | void;
  isProtectingAll?: boolean;
  protectingSymbols?: string[];
  autoShieldEnabled?: boolean;
  onToggleAutoShield?: () => void;
}

export default function PositionsOrdersView({
  positions,
  onClosePosition,
  onProtectPosition,
  onProtectAllPositions,
  isProtectingAll = false,
  protectingSymbols = [],
  autoShieldEnabled = true,
  onToggleAutoShield,
}: PositionsOrdersViewProps) {
  const [modalPos, setModalPos] = useState<Position | null>(null);
  const [customSL, setCustomSL] = useState<string>('');
  const [customTP, setCustomTP] = useState<string>('');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const totalNetPnl = positions.reduce((sum, p) => sum + p.netPnl, 0);
  const totalGrossPnl = positions.reduce((sum, p) => sum + p.grossPnl, 0);
  const totalFees = positions.reduce((sum, p) => sum + p.feesPaid, 0);

  const unprotectedPositions = positions.filter(p => !p.stopLoss || p.stopLoss === 0 || !p.takeProfit || p.takeProfit === 0);
  const unprotectedCount = unprotectedPositions.length;

  const openCustomModal = (pos: Position) => {
    setModalPos(pos);
    setModalError(null);
    const isLong = pos.side === 'LONG';
    const currentPrice = pos.currentPrice || pos.entryPrice;

    // Default values if not set
    const defaultSL = pos.stopLoss > 0 
      ? pos.stopLoss 
      : (isLong ? currentPrice * 0.988 : currentPrice * 1.012);
    
    const risk = Math.abs(currentPrice - defaultSL);
    const defaultTP = pos.takeProfit > 0 
      ? pos.takeProfit 
      : (isLong ? currentPrice + 2 * risk : currentPrice - 2 * risk);

    setCustomSL(defaultSL.toFixed(4));
    setCustomTP(defaultTP.toFixed(4));
  };

  const handleApplyPreset = (slPct: number, rrRatio: number) => {
    if (!modalPos) return;
    const isLong = modalPos.side === 'LONG';
    const currentPrice = modalPos.currentPrice || modalPos.entryPrice;

    const sl = isLong ? currentPrice * (1 - slPct / 100) : currentPrice * (1 + slPct / 100);
    const risk = Math.abs(currentPrice - sl);
    const tp = isLong ? currentPrice + (risk * rrRatio) : currentPrice - (risk * rrRatio);

    setCustomSL(sl.toFixed(4));
    setCustomTP(tp.toFixed(4));
    setModalError(null);
  };

  const handleSaveCustomTPSL = async () => {
    if (!modalPos || !onProtectPosition) return;
    const sl = parseFloat(customSL);
    const tp = parseFloat(customTP);

    if (isNaN(sl) || sl <= 0 || isNaN(tp) || tp <= 0) {
      setModalError('Please enter valid positive prices for Stop Loss and Take Profit.');
      return;
    }

    const isLong = modalPos.side === 'LONG';
    const cur = modalPos.currentPrice || modalPos.entryPrice;

    if (isLong && sl >= cur) {
      setModalError(`For LONG position, Stop Loss ($${sl}) must be below current mark price ($${cur.toFixed(4)}).`);
      return;
    }
    if (isLong && tp <= cur) {
      setModalError(`For LONG position, Take Profit ($${tp}) must be above current mark price ($${cur.toFixed(4)}).`);
      return;
    }
    if (!isLong && sl <= cur) {
      setModalError(`For SHORT position, Stop Loss ($${sl}) must be above current mark price ($${cur.toFixed(4)}).`);
      return;
    }
    if (!isLong && tp >= cur) {
      setModalError(`For SHORT position, Take Profit ($${tp}) must be below current mark price ($${cur.toFixed(4)}).`);
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    try {
      await onProtectPosition(modalPos.symbol, sl, tp);
      setModalPos(null);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update TP/SL');
    } finally {
      setModalSubmitting(false);
    }
  };

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
            {onToggleAutoShield && (
              <button
                type="button"
                onClick={onToggleAutoShield}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                  autoShieldEnabled 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AUTO-SHIELD: {autoShieldEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}
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

      {/* Unprotected Positions Warning Banner & One-Click Shield All */}
      {unprotectedCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900/90 to-amber-950/70 border border-amber-600/50 rounded-xl p-4 shadow-[0_0_15px_rgba(245,158,11,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <span>{unprotectedCount} Running Trade{unprotectedCount > 1 ? 's' : ''} Missing Stop Loss & Take Profit</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Auto-Shield Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Active Binance positions ({unprotectedPositions.map(p => p.symbol).slice(0, 4).join(', ')}{unprotectedPositions.length > 4 ? '...' : ''}) currently have no TP/SL protection attached.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {onProtectAllPositions && (
              <button
                type="button"
                onClick={onProtectAllPositions}
                disabled={isProtectingAll}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                {isProtectingAll ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Shielding All Running Trades...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>🛡️ Auto-Add 1:2 TP/SL to All ({unprotectedCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Active Contracts</h3>
            <span className="text-xs text-slate-400 font-mono">({positions.length} Open)</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Real-time WebSocket Mark Price</span>
        </div>

        {positions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Crosshair className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No Active Positions</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The automated bot is scanning 10 categories for confirmed dual-engine signals on the 5m timeframe.
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
                  <th className="py-3 px-4 text-right text-rose-400">Stop Loss</th>
                  <th className="py-3 px-4 text-right text-purple-400">Liq Price</th>
                  <th className="py-3 px-4 text-right text-emerald-400">1:2 RR TP</th>
                  <th className="py-3 px-4 text-right">Fees Paid</th>
                  <th className="py-3 px-4 text-right text-amber-300">Net PnL (After Fees)</th>
                  <th className="py-3 px-4 text-right">Exit & Protection Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {positions.map((pos) => {
                  const isLong = pos.side === 'LONG';
                  const distToSL = pos.stopLoss > 0 ? Math.abs(pos.currentPrice - pos.stopLoss) / pos.currentPrice * 100 : 0;
                  const distToTP = pos.takeProfit > 0 ? Math.abs(pos.takeProfit - pos.currentPrice) / pos.currentPrice * 100 : 0;
                  const distToLiq = pos.liquidationPrice > 0 ? Math.abs(pos.currentPrice - pos.liquidationPrice) / pos.currentPrice * 100 : 0;
                  const isProtected = pos.stopLoss > 0 && pos.takeProfit > 0;
                  const isSymbolProtecting = protectingSymbols.includes(pos.symbol);

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
                        {pos.stopLoss > 0 ? (
                          <>
                            <div>${pos.stopLoss.toFixed(4)}</div>
                            <div className="text-[9px] text-slate-500">{distToSL.toFixed(2)}% away</div>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-300 bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 rounded font-bold inline-block">
                            ⚠️ NO STOP LOSS
                          </span>
                        )}
                      </td>

                      {/* Liquidation Price */}
                      <td className="py-3 px-4 text-right text-purple-400 font-mono">
                        <div>${pos.liquidationPrice > 0 ? pos.liquidationPrice.toFixed(4) : '--'}</div>
                        <div className="text-[9px] text-slate-500">{distToLiq.toFixed(2)}% away</div>
                      </td>

                      {/* Take Profit (1:2 RR Target) */}
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                        {pos.takeProfit > 0 ? (
                          <>
                            <div>${pos.takeProfit.toFixed(4)}</div>
                            <div className="text-[9px] text-slate-500">{distToTP.toFixed(2)}% away</div>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-300 bg-amber-950/90 border border-amber-500/60 px-1.5 py-0.5 rounded font-bold inline-block">
                            ⚠️ NO TAKE PROFIT
                          </span>
                        )}
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
                        <div className="flex flex-col items-end gap-1.5">
                          {isProtected ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                                🛡️ PROTECTED (1:2 RR)
                              </span>
                              <button
                                type="button"
                                onClick={() => openCustomModal(pos)}
                                className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-700 transition-colors cursor-pointer"
                                title="Adjust TP/SL targets"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {onProtectPosition && (
                                <button
                                  type="button"
                                  onClick={() => onProtectPosition(pos.symbol)}
                                  disabled={isSymbolProtecting}
                                  className="text-[10px] text-cyan-300 hover:text-white bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/60 px-2 py-1 rounded font-bold transition-all shadow-[0_0_8px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                >
                                  {isSymbolProtecting ? (
                                    <>
                                      <div className="w-2.5 h-2.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                      <span>Shielding...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>🛡️ Set 1:2 TP/SL</span>
                                    </>
                                  )}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openCustomModal(pos)}
                                className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-1.5 py-1 rounded border border-slate-700 transition-colors cursor-pointer"
                                title="Set custom TP/SL"
                              >
                                ⚙️
                              </button>
                            </div>
                          )}

                          {onClosePosition && (
                            <button
                              type="button"
                              onClick={() => onClosePosition(pos.symbol)}
                              className="text-[10px] text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 px-2 py-0.5 rounded font-mono transition-colors cursor-pointer"
                            >
                              Market Close
                            </button>
                          )}
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

      {/* Custom TP/SL Modal */}
      {modalPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Manage TP & SL: {modalPos.symbol}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalPos(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Position Side</span>
                <span className={`font-bold ${modalPos.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {modalPos.side} ({modalPos.leverage}x)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Mark Price</span>
                <span className="font-bold text-white">${modalPos.currentPrice.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Entry Price</span>
                <span className="font-bold text-slate-300">${modalPos.entryPrice.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Liquidation Price</span>
                <span className="font-bold text-purple-400">${modalPos.liquidationPrice > 0 ? modalPos.liquidationPrice.toFixed(4) : '--'}</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Quick Risk/Reward Presets:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.2, 2.0)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 cursor-pointer"
                >
                  1.2% SL / 1:2 RR (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.5, 2.0)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  1.5% SL / 1:2 RR
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(1.0, 3.0)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  1.0% SL / 1:3 RR
                </button>
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-rose-400 flex items-center justify-between">
                  <span>Stop Loss Trigger Price ($)</span>
                  <span className="text-[10px] text-slate-500">
                    {modalPos.side === 'LONG' ? 'Must be < Mark Price' : 'Must be > Mark Price'}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={customSL}
                  onChange={(e) => setCustomSL(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-rose-500 focus:outline-none"
                  placeholder="0.0000"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>Take Profit Trigger Price ($)</span>
                  <span className="text-[10px] text-slate-500">
                    {modalPos.side === 'LONG' ? 'Must be > Mark Price' : 'Must be < Mark Price'}
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={customTP}
                  onChange={(e) => setCustomTP(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="0.0000"
                />
              </div>
            </div>

            {modalError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalPos(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTPSL}
                disabled={modalSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-bold font-mono text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              >
                {modalSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Placing on Binance...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply Protective Orders</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
