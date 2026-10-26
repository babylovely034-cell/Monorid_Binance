'use client';

import React, { useState } from 'react';
import { 
  CategorySummary, 
  AssetScanningState, 
  Position 
} from '@/lib/types';
import { calculateLiquidationPrice, isStopLossOverLiquidation, evaluateSignalStrength } from '@/lib/indicators';
import { 
  Layers, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertCircle, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle,
  LayoutGrid,
  List,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface MarketScannerViewProps {
  categories: CategorySummary[];
  positions: Position[];
  onInspectAsset: (asset: AssetScanningState) => void;
}

export default function MarketScannerView({
  categories,
  positions,
  onInspectAsset,
}: MarketScannerViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signalFilter, setSignalFilter] = useState<'all' | 'confirmed' | 'buy' | 'sell'>('all');

  const selectedCategories = activeCategoryTab === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategoryTab);

  let displayedAssets: { asset: AssetScanningState; categoryName: string }[] = [];
  selectedCategories.forEach(cat => {
    cat.assets.forEach(asset => {
      displayedAssets.push({ asset, categoryName: cat.name });
    });
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    displayedAssets = displayedAssets.filter(item => 
      item.asset.symbol.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q)
    );
  }

  if (signalFilter === 'confirmed') {
    displayedAssets = displayedAssets.filter(item => 
      item.asset.signalStatus === 'CONFIRMED_BUY' || item.asset.signalStatus === 'CONFIRMED_SELL'
    );
  } else if (signalFilter === 'buy') {
    displayedAssets = displayedAssets.filter(item => 
      item.asset.signalStatus === 'CONFIRMED_BUY'
    );
  } else if (signalFilter === 'sell') {
    displayedAssets = displayedAssets.filter(item => 
      item.asset.signalStatus === 'CONFIRMED_SELL'
    );
  }

  const totalScannedAssets = categories.reduce((sum, cat) => sum + cat.assets.length, 0);

  return (
    <div className="space-y-6">
      {/* Header and Strategy Rules Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Binance USDT-M 10 Categories Market Scanner</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous 5-minute timeframe scanner. 160 assets grouped in 10 categories, ranked by 24h maximum market changes.
            </p>
          </div>

          {/* View Switcher & Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>10 Categories Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>All Assets List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Strategy Execution Logic Banner */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono shrink-0">
              1
            </div>
            <div>
              <span className="font-bold text-emerald-400 block">Primary Trend Engine (5m TF)</span>
              <span className="text-slate-400 text-[11px]">
                MAvg dynamic trailing stop filter triggers primary directional bias.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono shrink-0">
              2
            </div>
            <div>
              <span className="font-bold text-amber-400 block">Composite Momentum Confirmation Gate</span>
              <span className="text-slate-400 text-[11px]">
                Buy requires Osc &gt; 0. Sell requires Osc &lt; 0. <em>No confirmation no trade!</em>
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono shrink-0">
              3
            </div>
            <div>
              <span className="font-bold text-cyan-400 block">Dynamic Leverage & 1:2 RR</span>
              <span className="text-slate-400 text-[11px]">
                BEST signals use 15x, GOOD signals use 10x leverage. Fixed 1:2 RR TP target.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs and Filter Controls */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setActiveCategoryTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeCategoryTab === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All 10 Categories
          </button>
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveCategoryTab(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeCategoryTab === c.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              #{i + 1} {c.name}
            </button>
          ))}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search symbol (e.g. BTC, SOL, PEPE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Filter:
            </span>
            <div className="flex items-center gap-1 font-mono text-xs">
              <button
                onClick={() => setSignalFilter('all')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  signalFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({displayedAssets.length})
              </button>
              <button
                onClick={() => setSignalFilter('confirmed')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  signalFilter === 'confirmed' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                Confirmed Only
              </button>
              <button
                onClick={() => setSignalFilter('buy')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  signalFilter === 'buy' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setSignalFilter('sell')}
                className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                  signalFilter === 'sell' ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode 1: 10 Categories Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {selectedCategories.map((category, index) => {
            const confirmedBuys = category.assets.filter(a => a.signalStatus === 'CONFIRMED_BUY').length;
            const confirmedSells = category.assets.filter(a => a.signalStatus === 'CONFIRMED_SELL').length;

            return (
              <div 
                key={category.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md hover:border-slate-700 transition-all"
              >
                {/* Category Header */}
                <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        CAT #{index + 1}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {category.name}
                      </h3>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Scanning 5m
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {category.description}
                    </p>
                  </div>

                  {/* Category Aggregates */}
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">Avg 24h:</span>
                      <span className={`text-xs font-mono font-bold ${category.avgChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {category.avgChange24h >= 0 ? '+' : ''}{category.avgChange24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Net PnL:</span>
                      <span className={`text-xs font-mono font-bold ${category.totalCategoryNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {category.totalCategoryNetPnl >= 0 ? '+' : ''}${category.totalCategoryNetPnl.toFixed(2)} ({category.totalCategoryNetPnlPercent >= 0 ? '+' : ''}{category.totalCategoryNetPnlPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Qualification & Signals Status Banner */}
                <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Qualification: <strong className="text-white">16/16 Qualified</strong> ($5M+ vol threshold)</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-emerald-400">{confirmedBuys} Confirmed BUY</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400">{confirmedSells} Confirmed SELL</span>
                  </div>
                </div>

                {/* 16 Scanned Assets Table (Sorted by Maximum 24h Change) */}
                <div className="overflow-x-auto max-h-[380px] overflow-y-auto divide-y divide-slate-800/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 sticky top-0 text-[11px] text-slate-400 font-mono">
                      <tr>
                        <th className="py-2 px-3">Asset</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-right">24h Change</th>
                        <th className="py-2 px-3 text-center">Trend State</th>
                        <th className="py-2 px-3 text-center">Momentum Osc</th>
                        <th className="py-2 px-3 text-right font-bold text-amber-300">Trade PnL %</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono">
                      {category.assets.map((asset) => {
                        const isBullishPMax = asset.pmaxDir === 1;
                        const isOscAboveZero = asset.proScalperOsc > 0;
                        const isConfirmed = asset.signalStatus === 'CONFIRMED_BUY' || asset.signalStatus === 'CONFIRMED_SELL';
                        const activePosition = positions.find(p => p.symbol === asset.symbol);

                        const signalEval = evaluateSignalStrength(
                          asset.pmaxDir === 1 ? 'LONG' : 'SHORT',
                          asset.proScalperOsc
                        );
                        const prospectiveSL = asset.pmaxDir === 1 ? asset.swingLow : asset.swingHigh;
                        const prospectiveLiq = calculateLiquidationPrice(
                          asset.pmaxDir === 1 ? 'LONG' : 'SHORT',
                          asset.currentPrice,
                          signalEval.leverage
                        );
                        const liqCheck = isStopLossOverLiquidation(
                          asset.pmaxDir === 1 ? 'LONG' : 'SHORT',
                          prospectiveSL,
                          prospectiveLiq
                        );

                        return (
                          <tr 
                            key={`${category.id}-${asset.symbol}`}
                            className={`hover:bg-slate-800/50 transition-colors ${
                              activePosition ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            {/* Asset Name */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <span>{asset.symbol.replace('USDT', '')}</span>
                                <span className="text-[10px] font-normal text-slate-500">/USDT</span>
                                {activePosition && (
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                    activePosition.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                  }`}>
                                    {activePosition.side} {activePosition.leverage}x
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Live Price */}
                            <td className="py-2.5 px-3 text-right text-slate-200">
                              ${asset.currentPrice < 1 
                                ? asset.currentPrice.toFixed(4) 
                                : asset.currentPrice < 100 
                                ? asset.currentPrice.toFixed(2) 
                                : asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                              }
                            </td>

                            {/* 24h Change % (Sorted by maximum) */}
                            <td className="py-2.5 px-3 text-right">
                              <span className={`inline-flex items-center gap-0.5 font-bold ${
                                asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                              </span>
                            </td>

                            {/* PMax Band */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isBullishPMax 
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                              }`}>
                                {isBullishPMax ? 'BULL' : 'BEAR'}
                              </span>
                            </td>

                            {/* Pro Scalper AI Oscillator & Strength */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                  isOscAboveZero 
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                                }`} title={`Oscillator: ${asset.proScalperOsc.toFixed(2)} vs Zero Line`}>
                                  {isOscAboveZero ? `+${asset.proScalperOsc.toFixed(0)} >0` : `${asset.proScalperOsc.toFixed(0)} <0`}
                                </span>
                                {isConfirmed && (
                                  <span className={`text-[9px] font-bold mt-0.5 ${signalEval.strength === 'BEST' ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {signalEval.leverage}x {signalEval.strength}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Executed Trade PnL % */}
                            <td className="py-2.5 px-3 text-right">
                              {activePosition ? (
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  activePosition.netPnlPercent >= 0 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}>
                                  {activePosition.netPnlPercent >= 0 ? '+' : ''}{activePosition.netPnlPercent.toFixed(1)}% NET
                                </span>
                              ) : asset.recentPnlPercent !== undefined ? (
                                <span className={`font-medium text-[11px] ${
                                  asset.recentPnlPercent >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'
                                }`}>
                                  {asset.recentPnlPercent >= 0 ? '+' : ''}{asset.recentPnlPercent.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-600">--</span>
                              )}
                            </td>

                            {/* Action / Trigger */}
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {activePosition ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                    IN TRADE
                                  </span>
                                ) : liqCheck.isOver ? (
                                  <span 
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 font-mono font-bold"
                                    title={`Avoided trade: SL ($${prospectiveSL.toFixed(2)}) is over Liquidation price ($${prospectiveLiq.toFixed(2)})`}
                                  >
                                    AVOID LIQ
                                  </span>
                                ) : isConfirmed ? (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono animate-pulse">
                                    AUTO {signalEval.leverage}x
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    SCANNING
                                  </span>
                                )}

                                <button
                                  onClick={() => onInspectAsset(asset)}
                                  className="p-1 rounded text-slate-400 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
                                  title="Inspect 5m chart and technical indicators"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>16 Assets Ranked by Max 24h Change</span>
                  <span className="text-slate-500 text-[11px] font-mono">5m Candle Resolution</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mode 2: All Assets List View */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-4">Asset & Category</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">24h Change</th>
                  <th className="py-3 px-4 text-right">24h Volume</th>
                  <th className="py-3 px-4 text-center">Trend State</th>
                  <th className="py-3 px-4 text-center">Composite Osc</th>
                  <th className="py-3 px-4 text-center">Confirmation</th>
                  <th className="py-3 px-4 text-right">Swing SL / 1:2 TP</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No assets match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  displayedAssets.map(({ asset, categoryName }) => {
                    const isBullishPMax = asset.pmaxDir === 1;
                    const isOscAboveZero = asset.proScalperOsc > 0;
                    const isConfirmed = asset.signalStatus === 'CONFIRMED_BUY' || asset.signalStatus === 'CONFIRMED_SELL';
                    const activePos = positions.find(p => p.symbol === asset.symbol);

                    // Calculate prospective SL and TP
                    const prospectiveSL = isBullishPMax ? asset.swingLow : asset.swingHigh;
                    const risk = isBullishPMax ? (asset.currentPrice - prospectiveSL) : (prospectiveSL - asset.currentPrice);
                    const prospectiveTP = isBullishPMax
                      ? asset.currentPrice + 2 * Math.max(risk, asset.currentPrice * 0.005)
                      : asset.currentPrice - 2 * Math.max(risk, asset.currentPrice * 0.005);

                    return (
                      <tr 
                        key={`${asset.category}-${asset.symbol}`}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          activePos ? 'bg-amber-500/5' : ''
                        }`}
                      >
                        {/* Asset & Category */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-sm">
                                {asset.symbol}
                              </span>
                              {asset.isQualified ? (
                                <span className="text-[10px] text-emerald-400 font-sans" title="Qualified ($5M+ volume, high volatility)">
                                  ✓ Qual
                                </span>
                              ) : (
                                <span className="text-[10px] text-rose-400 font-sans" title={asset.disqualificationReason}>
                                  ⚠ Disqual
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {categoryName}
                            </span>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 text-right text-slate-200">
                          ${asset.currentPrice < 1 
                            ? asset.currentPrice.toFixed(4) 
                            : asset.currentPrice < 100 
                            ? asset.currentPrice.toFixed(2) 
                            : asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                          }
                        </td>

                        {/* 24h Change */}
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex items-center gap-0.5 font-bold ${
                            asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </span>
                        </td>

                        {/* 24h Volume */}
                        <td className="py-3 px-4 text-right text-slate-400">
                          ${(asset.volume24h / 1e6).toFixed(1)}M
                        </td>

                        {/* PMax State */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isBullishPMax 
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}>
                              {isBullishPMax ? 'BULLISH BAND' : 'BEARISH BAND'}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5">
                              Stop: ${asset.pmaxLine.toFixed(2)}
                            </span>
                          </div>
                        </td>

                        {/* Pro Scalper AI Oscillator */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOscAboveZero 
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                            }`}>
                              Osc: {asset.proScalperOsc > 0 ? '+' : ''}{asset.proScalperOsc.toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {isOscAboveZero ? '> Zero Line (Bull)' : '< Zero Line (Bear)'}
                            </span>
                          </div>
                        </td>

                        {/* Confirmation Status */}
                        <td className="py-3 px-4 text-center">
                          {asset.signalStatus === 'CONFIRMED_BUY' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] animate-pulse">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              CONFIRMED BUY
                            </span>
                          ) : asset.signalStatus === 'CONFIRMED_SELL' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[11px] animate-pulse">
                              <CheckCircle className="w-3 h-3 text-rose-400" />
                              CONFIRMED SELL
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              No Confirmation
                            </span>
                          )}
                        </td>

                        {/* Prospective Swing SL / 1:2 TP */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col text-[10px]">
                            <span className="text-rose-400">
                              SL: ${prospectiveSL.toFixed(2)}
                            </span>
                            <span className="text-emerald-400 font-bold">
                              TP: ${prospectiveTP.toFixed(2)} (1:2)
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {activePos ? (
                              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                                IN BOT TRADE
                              </span>
                            ) : isConfirmed ? (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                                AUTO CONFIRMED
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-mono">
                                SCANNING 5m
                              </span>
                            )}
                            <button
                              onClick={() => onInspectAsset(asset)}
                              className="px-2 py-0.5 rounded text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer font-mono transition-colors"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
