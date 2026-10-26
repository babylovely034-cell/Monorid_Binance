'use client';

import React, { useState } from 'react';
import { ClosedTrade } from '@/lib/types';
import { formatUtcDateTime } from '@/lib/formatters';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  DollarSign, 
  Percent, 
  Download, 
  Filter,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface HistoryAnalyticsViewProps {
  closedTrades: ClosedTrade[];
  sessionStartTime?: number;
}

export default function HistoryAnalyticsView({
  closedTrades,
  sessionStartTime,
}: HistoryAnalyticsViewProps) {
  const [viewScope, setViewScope] = useState<'CURRENT_RUN' | 'ACCOUNT_HISTORY'>('CURRENT_RUN');
  const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterReason, setFilterReason] = useState<string>('ALL');

  // Filter based on session scope
  const activeTrades = viewScope === 'CURRENT_RUN'
    ? closedTrades.filter(t => t.exitTime >= (sessionStartTime || 0))
    : closedTrades;

  // Performance calculations
  const totalTrades = activeTrades.length;
  const winningTrades = activeTrades.filter(t => t.netPnl > 0);
  const losingTrades = activeTrades.filter(t => t.netPnl < 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

  const totalGrossPnl = activeTrades.reduce((sum, t) => sum + t.grossPnl, 0);
  const totalFeesPaid = activeTrades.reduce((sum, t) => sum + t.totalFeesPaid, 0);
  const totalNetPnl = activeTrades.reduce((sum, t) => sum + t.netPnl, 0);

  const grossProfit = winningTrades.reduce((sum, t) => sum + t.grossPnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.grossPnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'MAX' : '0.00');

  const filteredTrades = activeTrades.filter(t => {
    if (filterSide !== 'ALL' && t.side !== filterSide) return false;
    if (filterReason !== 'ALL' && t.exitReason !== filterReason) return false;
    return true;
  });

  const downloadCsv = () => {
    if (closedTrades.length === 0) return;
    const headers = [
      'ID', 'ExitTime', 'Symbol', 'Category', 'Side', 'EntryPrice', 'ExitPrice',
      'Quantity', 'Leverage', 'Margin', 'GrossPnL', 'TotalFeesPaid', 'NetPnL', 'NetPnLPercent', 'ExitReason'
    ];
    const rows = closedTrades.map(t => [
      t.id,
      new Date(t.exitTime).toISOString(),
      t.symbol,
      t.category,
      t.side,
      t.entryPrice,
      t.exitPrice,
      t.quantity,
      t.leverage,
      t.margin,
      t.grossPnl.toFixed(4),
      t.totalFeesPaid.toFixed(4),
      t.netPnl.toFixed(4),
      t.netPnlPercent.toFixed(2),
      t.exitReason
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monorid_trading_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Realized PnL (After Binance Fees) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Net Realized PnL</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-mono font-bold ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Gross: ${totalGrossPnl.toFixed(2)}</span>
            <span className="text-amber-400">Fees: -${totalFeesPaid.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 2: Win Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Win Rate</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">
              {winRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({winningTrades.length}W / {losingTrades.length}L)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Based on {totalTrades} closed algorithmic executions
          </p>
        </div>

        {/* Metric 3: Profit Factor */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Profit Factor</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-cyan-400">
              {profitFactor}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (1:2 RR Target)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Ratio of gross profits to gross losses
          </p>
        </div>

        {/* Metric 4: Platform Fee Deductions */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Binance Platform Fees</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-400">
              ${totalFeesPaid.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Paid USDT
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Deducted automatically on entry & exit
          </p>
        </div>
      </div>

      {/* Trade History Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
        {/* Table Header & Controls */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Closed Executed Trades History</h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Side filter */}
            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Sides</option>
              <option value="LONG">Longs Only</option>
              <option value="SHORT">Shorts Only</option>
            </select>

            {/* Exit reason filter */}
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Exit Types</option>
              <option value="TAKE_PROFIT">TP Hits (1:2 RR)</option>
              <option value="STOP_LOSS">SL Hits (Swing Low/High)</option>
              <option value="MANUAL_CLOSE">Manual Closes</option>
            </select>

            {/* Export CSV button */}
            <button
              onClick={downloadCsv}
              disabled={closedTrades.length === 0}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        {filteredTrades.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No closed trades found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Symbol / Side</th>
                  <th className="py-3 px-4 text-right">Entry Price</th>
                  <th className="py-3 px-4 text-right">Exit Price</th>
                  <th className="py-3 px-4 text-right">Gross PnL</th>
                  <th className="py-3 px-4 text-right">Binance Fees</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-300">Net PnL (After Fees)</th>
                  <th className="py-3 px-4 text-center">Exit Trigger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.map((trade) => {
                  const isProfit = trade.netPnl >= 0;
                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Exit Time */}
                      <td className="py-3 px-4 text-slate-400">
                        {formatUtcDateTime(trade.exitTime)}
                      </td>

                      {/* Symbol / Side */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{trade.symbol}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            trade.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {trade.side} {trade.leverage}x
                          </span>
                        </div>
                      </td>

                      {/* Entry Price */}
                      <td className="py-3 px-4 text-right text-slate-300">
                        ${trade.entryPrice.toFixed(4)}
                      </td>

                      {/* Exit Price */}
                      <td className="py-3 px-4 text-right text-white font-medium">
                        ${trade.exitPrice.toFixed(4)}
                      </td>

                      {/* Gross PnL */}
                      <td className={`py-3 px-4 text-right font-medium ${trade.grossPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.grossPnl >= 0 ? '+' : ''}${trade.grossPnl.toFixed(2)}
                      </td>

                      {/* Binance Platform Fees Paid */}
                      <td className="py-3 px-4 text-right text-amber-400">
                        -${trade.totalFeesPaid.toFixed(3)}
                        <span className="text-[9px] text-slate-500 block">
                          (Entry: -${trade.entryFee.toFixed(3)} | Exit: -${trade.exitFee.toFixed(3)})
                        </span>
                      </td>

                      {/* Net Realized PnL (After Fees) */}
                      <td className="py-3 px-4 text-right">
                        <div className={`font-bold text-sm ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${trade.netPnl.toFixed(2)}
                        </div>
                        <div className={`text-[10px] ${isProfit ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
                          {isProfit ? '+' : ''}{trade.netPnlPercent.toFixed(2)}% ROI
                        </div>
                      </td>

                      {/* Exit Reason */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.exitReason === 'TAKE_PROFIT'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : trade.exitReason === 'STOP_LOSS'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {trade.exitReason === 'TAKE_PROFIT'
                            ? '1:2 RR TP HIT'
                            : trade.exitReason === 'STOP_LOSS'
                            ? 'SWING SL HIT'
                            : 'MANUAL CLOSE'}
                        </span>
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
