'use client';

import React from 'react';
import { PnLDataPoint } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, ShieldAlert, Lock } from 'lucide-react';

interface ActualPnLChartProps {
  startingBalance: number;
  currentBalance: number;
  dataPoints: PnLDataPoint[];
  minimumBuffer: number;
}

export default function ActualPnLChart({
  startingBalance,
  currentBalance,
  dataPoints,
  minimumBuffer = 1.20,
}: ActualPnLChartProps) {
  const actualProfitDollar = currentBalance - startingBalance;
  const actualProfitPercent = startingBalance > 0 ? (actualProfitDollar / startingBalance) * 100 : 0;
  const isProfit = actualProfitDollar >= 0;

  // Compute SVG chart coordinates
  const points = dataPoints.length > 0 ? dataPoints : [
    { timestamp: 0, balance: startingBalance, netPnl: 0, netPnlPercent: 0, label: 'Start' },
    { timestamp: 1, balance: currentBalance, netPnl: actualProfitDollar, netPnlPercent: actualProfitPercent, label: 'Now' }
  ];

  const minVal = Math.min(minimumBuffer, ...points.map(p => p.balance)) * 0.96;
  const maxVal = Math.max(startingBalance * 1.05, ...points.map(p => p.balance)) * 1.04;
  const range = maxVal - minVal || 1;

  const width = 800;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getX = (idx: number) => {
    return paddingX + (idx / Math.max(points.length - 1, 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / range) * (height - 2 * paddingY);
  };

  const pathD = points.reduce((acc, p, i) => {
    const x = getX(i);
    const y = getY(p.balance);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = pathD ? `${pathD} L ${getX(points.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z` : '';
  const startingY = getY(startingBalance);
  const bufferY = getY(minimumBuffer);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Actual Profit & Loss Growth</span>
            </h3>
          </div>
        </div>

        {/* Highlighted Actual Profit */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-xs text-slate-400">Actual PnL:</span>
          <span className={`text-xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isProfit ? '+' : ''}${actualProfitDollar.toFixed(2)}
          </span>
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
            isProfit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isProfit ? '+' : ''}{actualProfitPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="w-full overflow-hidden bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-48 overflow-visible">
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={startingY}
            x2={width - paddingX}
            y2={startingY}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <text
            x={paddingX + 6}
            y={startingY - 6}
            fill="#f59e0b"
            fontSize="10"
            fontFamily="monospace"
          >
            Fixed Starting Baseline: ${startingBalance.toFixed(2)}
          </text>

          {/* Minimum $1.20 Buffer threshold line */}
          <line
            x1={paddingX}
            y1={bufferY}
            x2={width - paddingX}
            y2={bufferY}
            stroke="#f43f5e"
            strokeDasharray="2 3"
            strokeWidth="1"
            opacity="0.5"
          />
          <text
            x={width - paddingX - 160}
            y={bufferY - 4}
            fill="#f43f5e"
            fontSize="9"
            fontFamily="monospace"
          >
            $1.20 Minimum Reserve Limit
          </text>

          {/* Fill Area */}
          <path d={areaD} fill="url(#pnlGradient)" />

          {/* Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(p.balance);
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  ${p.balance.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Chart Legend Footer */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 px-3 border-t border-slate-900">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-0.5 bg-amber-400 border-dashed inline-block" />
              Starting Balance Baseline
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Live Net Balance
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-3 h-0.5 bg-rose-500 border-dashed inline-block" />
              $1.20 Reserve Buffer
            </span>
          </div>

          <span>10% Balance Allocated / Trade</span>
        </div>
      </div>
    </div>
  );
}
