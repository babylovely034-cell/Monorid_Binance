'use client';

import React from 'react';
import { motion } from 'motion/react';
import { 
  CategorySummary, 
  Position, 
  TradingSettings,
  PnLDataPoint
} from '@/lib/types';
import ActualPnLChart from './ActualPnLChart';
import { MiroStyleLogo } from './MiroStyleLogo';
import { BotMotionIcon } from './BotMotionIcons';
import { 
  Zap,
  Shield,
  TrendingUp,
  Compass
} from 'lucide-react';

interface DashboardMainProps {
  categories: CategorySummary[];
  positions: Position[];
  settings: TradingSettings;
  startingBalance: number;
  currentBalance: number;
  availableBalance?: number;
  pnlDataPoints: PnLDataPoint[];
  onNavigateTab: (tabId: string) => void;
}

export default function DashboardMain({
  categories,
  positions,
  settings,
  startingBalance,
  currentBalance,
  availableBalance,
  pnlDataPoints,
  onNavigateTab,
}: DashboardMainProps) {
  // Calculate actual PnL based on FIXED starting balance
  const actualProfitDollar = currentBalance - startingBalance;
  const actualProfitPercent = startingBalance > 0 ? (actualProfitDollar / startingBalance) * 100 : 0;
  const isProfit = actualProfitDollar >= 0;

  const isBelowReserve = currentBalance <= 1.20;
  const marginPerTrade = Math.max(0, currentBalance * 0.10);
  const totalOpenPositions = positions.length;
  const activeMargin = positions.reduce((sum, p) => sum + p.margin, 0);
  const freeUsdt = availableBalance !== undefined && availableBalance >= 0 ? availableBalance : Math.max(0, currentBalance - activeMargin);
  const marginUsedPercent = currentBalance > 0 ? (activeMargin / currentBalance) * 100 : 0;


  // Swarm Agent Names for the 10 Categories
  const AGENT_NAMES = [
    { name: 'Apex Momentum', catId: 'l1-mainstream' },
    { name: 'Mean Reversion', catId: 'l2-rollups' },
    { name: 'Breakout Hunter', catId: 'ai-big-data' },
    { name: 'Rapid Scalper', catId: 'defi-protocols' },
    { name: 'Swing Raider', catId: 'meme-coins' },
    { name: 'Volatility Reaper', catId: 'gaming-metaverse' },
    { name: 'Liquidity Sweeper', catId: 'rwa-payments' },
    { name: 'Order Flow Reaper', catId: 'infra-depin' },
    { name: 'Interchain Pulse', catId: 'crosschain-interop' },
    { name: 'Surge Breakout', catId: 'max-movers-volatility' },
  ];

  // User toggle for Swarm Radar fleet: default true to show ALL fleet bots surrounding the logo
  const [showAllFleet, setShowAllFleet] = React.useState(true);

  // Map agents with their live open positions
  const agentsWithPositions = AGENT_NAMES.map(agent => {
    const openPosList = positions.filter(p => p.category === agent.catId);
    return {
      ...agent,
      openPositions: openPosList,
      isOpen: openPosList.length > 0
    };
  });

  const activeBotAgents = agentsWithPositions.filter(a => a.isOpen);
  // Show all fleet bots surrounding the center logo by default, or only active running positions if filtered
  const displayAgents = showAllFleet ? agentsWithPositions : (activeBotAgents.length > 0 ? activeBotAgents : agentsWithPositions);
  const isShowingOnlyActive = !showAllFleet && activeBotAgents.length > 0;

  return (
    <div className="space-y-5 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Status Alert Bar with Smooth Motion */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 shadow-inner font-mono text-xs flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <motion.span 
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-2 h-2 rounded-full bg-emerald-400" 
            />
            <span className="text-slate-400">API:</span>
            <span className="text-emerald-400 font-bold">
              {settings.apiKey ? 'Live Connected' : 'API Key Required'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Balance:</span>
            <span className="text-white font-bold">${currentBalance.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Available:</span>
            <span className="text-white font-bold">${freeUsdt.toFixed(2)}</span>
          </div>

          {isBelowReserve ? (
            <motion.div 
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1.5 text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30"
            >
              <span>⚠️ Balance &lt; $1.20 (Trades Blocked)</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
              <span>✓ $1.20 Reserve Safe</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">Auto:</span>
            <span className="text-emerald-400 font-bold">ON</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-slate-400">Signals:</span>
            <span className="text-white font-bold">
              {categories.flatMap(c => c.assets).filter(a => a.signalStatus.startsWith('CONFIRMED')).length}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">Rule:</span>
            <span className="text-amber-400 font-bold">Dual-Engine Quant</span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="text-[11px] text-amber-400/90 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer font-mono"
        >
          <span>Settings & API keys</span>
        </button>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Monorid Quant Multi-Agent Swarm Radar with Upgraded Motion Graphics (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[680px] sm:min-h-[740px]">
          {/* Subtle Background Radar Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-950/35 via-slate-950/85 to-slate-950 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Radar Header Control Strip */}
          <div className="relative z-20 flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-200 font-bold uppercase tracking-wider">
                {isShowingOnlyActive 
                  ? `RUNNING BOT POSITIONS ONLY (${activeBotAgents.length} ACTIVE)` 
                  : `FULL QUANT SWARM RADAR (${displayAgents.length} FLEET)`}
              </span>
            </div>

            <button
              onClick={() => setShowAllFleet(prev => !prev)}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/60 text-cyan-400 hover:text-cyan-300 text-[10px] transition-all cursor-pointer shadow-sm"
            >
              {showAllFleet ? 'Show Running Only' : 'Show All 10 Fleet'}
            </button>
          </div>

          {/* Central Radar Stage: Aspect-Square Arena ensuring equal distance to all sides */}
          <div className="relative z-10 w-full flex-1 flex items-center justify-center my-auto min-h-[500px] sm:min-h-[540px] overflow-hidden">
            <div className="relative w-full max-w-[500px] sm:max-w-[530px] aspect-square flex items-center justify-center">

              {/* Rotating 360° Radar Sweep Beam Centered in Arena */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] h-[92%] rounded-full pointer-events-none z-0 opacity-25"
                style={{
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.45) 0deg, rgba(6, 182, 212, 0) 65deg, transparent 360deg)'
                }}
              />

              {/* Concentric Cybernetic Orbit Rings Centered in Arena */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full border border-cyan-500/15 pointer-events-none animate-[spin_180s_linear_infinite]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[72%] h-[72%] rounded-full border border-cyan-400/25 border-dashed pointer-events-none animate-[spin_90s_linear_infinite_reverse]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52%] h-[52%] rounded-full border border-cyan-300/30 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32%] h-[32%] rounded-full border border-cyan-400/35 border-dotted pointer-events-none" />

              {/* Motion Graphic: Expanding Energy Pulse Ring */}
              <motion.div 
                animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82%] h-[82%] rounded-full border border-cyan-400/30 pointer-events-none"
              />

              {/* SVG Overlay: High-Tech Radial Laser Conduits Connecting Middle Logo to Orbit Nodes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 540 540">
                <defs>
                  <filter id="conduitGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="glow" />
                    <feMerge>
                      <feMergeNode in="glow" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Outer Cybernetic Boundary Ring */}
                <circle cx="270" cy="270" r="248" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="1" />
                {/* Secondary Outer Dashed Guide Ring */}
                <circle cx="270" cy="270" r="226" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="0.8" strokeDasharray="2 4" />
                {/* Primary Orbital Bot Ring: Perfectly passes through all 10 bot centers at radius 196 */}
                <circle cx="270" cy="270" r="196" stroke="rgba(6, 182, 212, 0.22)" strokeWidth="1.2" strokeDasharray="4 4" />
                {/* Mid Sensor Orbit Ring */}
                <circle cx="270" cy="270" r="136" stroke="rgba(6, 182, 212, 0.18)" strokeWidth="1" strokeDasharray="3 3" />
                {/* Core Reactor Boundary Rings */}
                <circle cx="270" cy="270" r="36" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="1.2" strokeDasharray="2 2" />
                <circle cx="270" cy="270" r="48" stroke="rgba(6, 182, 212, 0.20)" strokeWidth="0.8" strokeDasharray="3 3" />

                {displayAgents.map((agent, index) => {
                  const angleDeg = (index * 360 / displayAgents.length) - 90;
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const cx = 270;
                  const cy = 270;
                  const rInner = 36;
                  const radiusPx = 196;
                  const xStart = cx + rInner * Math.cos(angleRad);
                  const yStart = cy + rInner * Math.sin(angleRad);
                  const xEnd = cx + radiusPx * Math.cos(angleRad);
                  const yEnd = cy + radiusPx * Math.sin(angleRad);

                  return (
                    <g key={`beam-${agent.catId}`}>
                      {/* Laser Conduit Line from Core Edge to Bot Center */}
                      <line
                        x1={xStart}
                        y1={yStart}
                        x2={xEnd}
                        y2={yEnd}
                        stroke={agent.isOpen ? 'rgba(16, 185, 129, 0.65)' : 'rgba(6, 182, 212, 0.26)'}
                        strokeWidth={agent.isOpen ? '2' : '1.2'}
                        strokeDasharray={agent.isOpen ? 'none' : '4 4'}
                      />
                      {/* Moving Energy Pulse Circle */}
                      <circle
                        r={agent.isOpen ? '3.5' : '2.5'}
                        fill={agent.isOpen ? '#34d399' : '#22d3ee'}
                        filter="url(#conduitGlow)"
                      >
                        <animate
                          attributeName="cx"
                          from={xStart}
                          to={xEnd}
                          dur={`${1.8 + (index % 3) * 0.4}s`}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          from={yStart}
                          to={yEnd}
                          dur={`${1.8 + (index % 3) * 0.4}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                      {/* Beacon Node at Bot Center Anchor Point */}
                      <circle
                        cx={xEnd}
                        cy={yEnd}
                        r={agent.isOpen ? '4' : '3'}
                        fill={agent.isOpen ? '#10b981' : '#06b6d4'}
                        opacity="0.85"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Central Core: Middle Logo Monorid geometrically centered with equal distance to all bot nodes */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center pointer-events-none">
                <div className="relative flex items-center justify-center pointer-events-auto">
                  {/* Outer Glowing Energy Halo */}
                  <motion.div 
                    animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="absolute -inset-3 rounded-2xl bg-cyan-500/25 blur-xl pointer-events-none -z-10"
                  />

                  {/* Previous Project Logo Component: MiroStyleLogo centered at true geometric midpoint */}
                  <motion.div 
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onNavigateTab('scanner')}
                    className="relative cursor-pointer flex items-center justify-center"
                  >
                    <MiroStyleLogo
                      size="md"
                      animated={true}
                      onClick={() => onNavigateTab('scanner')}
                    />
                  </motion.div>

                  {/* Floating Balanced HUD Label below logo - positioned absolutely so it does NOT shift the logo center */}
                  <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 flex flex-col items-center text-center whitespace-nowrap pointer-events-none z-40">
                    <span className="text-[9.5px] font-black tracking-widest text-cyan-300 font-mono drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] bg-slate-950/85 px-1.5 py-0.5 rounded border border-cyan-500/30 backdrop-blur-sm">
                      MONORID QUANT
                    </span>
                    <span className="text-[7.5px] font-bold tracking-widest text-slate-300 font-mono uppercase flex items-center gap-1 mt-0.5 bg-slate-950/85 px-1.5 py-0.5 rounded border border-slate-800/80 backdrop-blur-sm">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      FLEET ONLINE ({displayAgents.length}/{displayAgents.length})
                    </span>
                    <div className="mt-0.5 flex items-center gap-1 text-[7.5px] font-mono text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)] backdrop-blur-sm">
                      <span>{activeBotAgents.length} IN POSITION</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-cyan-300">1.8s CYCLE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orbiting Bot Nodes: Equidistant Radial Swarm Nodes Surrounding Middle Logo */}
              {displayAgents.map((agent, index) => {
                const cat = categories.find(c => c.id === agent.catId);
                const avgChange = cat ? cat.avgChange24h : 0;
                const isPos = avgChange >= 0;

                const openPos = agent.openPositions[0]; // First open position if running

                const angleDeg = (index * 360 / displayAgents.length) - 90;
                const angleRad = (angleDeg * Math.PI) / 180;
                const cx = 270;
                const cy = 270;
                const radiusPx = 196;
                const xEnd = cx + radiusPx * Math.cos(angleRad);
                const yEnd = cy + radiusPx * Math.sin(angleRad);

                const leftPct = ((xEnd / 540) * 100).toFixed(3);
                const topPct = ((yEnd / 540) * 100).toFixed(3);

                return (
                  <div
                    key={agent.catId}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="z-20 pointer-events-auto"
                  >
                    <motion.div
                      animate={{ 
                        y: index % 2 === 0 ? [-1.5, 1.5, -1.5] : [1.5, -1.5, 1.5]
                      }}
                      transition={{ 
                        y: { repeat: Infinity, duration: 3.5 + (index % 3) * 0.5, ease: 'easeInOut' }
                      }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onNavigateTab('scanner')}
                      className={`rounded-xl w-[88px] sm:w-[94px] py-1.5 px-1 sm:px-1.5 text-center cursor-pointer transition-all shadow-xl backdrop-blur-md group relative border ${
                        agent.isOpen 
                          ? 'bg-slate-900/95 border-emerald-400/90 shadow-[0_0_18px_rgba(52,211,153,0.35)] ring-1 ring-emerald-500/40' 
                          : 'bg-slate-900/90 hover:bg-slate-900 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      }`}
                    >
                      {/* Top scanner sweep shimmer bar across each bot card */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-[2px] ${
                          agent.isOpen
                            ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 animate-pulse'
                            : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                        }`}
                      />

                      {/* Glowing Cybernetic Motion Icon Box */}
                      <div className="w-6.5 h-6.5 mx-auto rounded-lg bg-slate-950/90 border border-cyan-500/50 flex items-center justify-center text-cyan-400 mb-1 shadow-md group-hover:border-cyan-300 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all">
                        <BotMotionIcon catId={agent.catId} isOpen={agent.isOpen} size={16} />
                      </div>

                      {/* Bot Name / Symbol Display */}
                      <h4 className="text-[8px] sm:text-[8.5px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate font-sans tracking-tight">
                        {openPos ? openPos.symbol : agent.name}
                      </h4>

                      {/* Running Position or Scan Pill */}
                      {openPos ? (
                        <div className="mt-0.5 font-mono text-[8px] flex flex-col items-center gap-0.5">
                          <span className={`font-bold px-1 py-0.2 rounded text-[7.5px] ${
                            openPos.side === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          }`}>
                            {openPos.side} {openPos.leverage}x
                          </span>
                          <span className={`font-bold text-[8.5px] ${openPos.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {openPos.netPnl >= 0 ? '+' : ''}${openPos.netPnl.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[8px] bg-slate-950/80 border border-slate-800/80 py-0.5 px-1 rounded">
                          <span className="text-cyan-400/80 text-[7px] uppercase">SCAN</span>
                          <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPos ? '+' : ''}{avgChange.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Swarm Footer Status Line with Motion Scan Line */}
          <div className="relative z-10 pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-500 gap-1 overflow-hidden">
            {/* Motion Scan Beam */}
            <motion.div 
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none"
            />

            <span className="text-cyan-400/90 font-bold flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              MONORID MULTI-AGENT SWARM
            </span>
            <span>
              {isShowingOnlyActive 
                ? `${activeBotAgents.length} BOTS ACTIVE IN RUNNING POSITIONS` 
                : 'ALL 10 FLEET BOTS SYNCED'} • EXPANDED RADIAL ORBIT
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <motion.span 
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400" 
              />
              AUTONOMOUS ENGAGED
            </span>
          </div>
        </div>

        {/* Right Column: Risk & Portfolio + Performance Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          {/* Card 1: Risk & Portfolio */}
          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Risk & Portfolio</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                MAX 10% / TRADE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Portfolio Risk</span>
                <span className="text-lg font-bold text-emerald-400">0.00%</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Max Drawdown</span>
                <span className="text-lg font-bold text-cyan-400">0.00%</span>
              </div>
            </div>

            {/* Margin Usage Gauge */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-cyan-500/40 flex items-center justify-center font-bold text-[10px] text-white bg-slate-950">
                  {marginUsedPercent.toFixed(0)}%
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>Futures Margin: <strong>${activeMargin.toFixed(2)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                    <span>Free USDT: <strong>${freeUsdt.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Positions</span>
                <span className="font-bold text-emerald-400 text-sm">{totalOpenPositions} Active</span>
              </div>
            </div>
          </div>

          {/* Card 2: Performance Summary */}
          <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Performance Summary</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                ALGO V2.4
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Today&apos;s P&L</span>
                <span className={`text-xl font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}{actualProfitPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  ({isProfit ? '+' : ''}${actualProfitDollar.toFixed(2)})
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Win Rate</span>
                <span className="text-xl font-bold text-white">75.0%</span>
              </div>
            </div>

            {/* Live P&L Growth Chart Benchmark Component */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 relative">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                <span>LIVE REALIZED P&L</span>
                <span className="text-emerald-400 font-bold">1:2 RR TARGET</span>
              </div>

              <ActualPnLChart
                startingBalance={startingBalance}
                currentBalance={currentBalance}
                dataPoints={pnlDataPoints}
                minimumBuffer={1.20}
              />
            </div>

            <div className="flex items-center justify-between font-mono text-xs text-slate-400 pt-1 border-t border-slate-900">
              <span>Profit Factor: <strong className="text-cyan-400">2.31</strong></span>
              <span>Total Trades: <strong className="text-white">107</strong></span>
            </div>

            <button
              onClick={() => onNavigateTab('history')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>View Closed Positions / Full Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
