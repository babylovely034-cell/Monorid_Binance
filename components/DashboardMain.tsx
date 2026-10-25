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
import { 
  DollarSign,
  Sliders,
  Zap,
  ShieldAlert,
  ArrowUpRight,
  Lock,
  Layers,
  Activity,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Cpu,
  Shield,
  Compass,
  Radio,
  ExternalLink,
  Target,
  BarChart2,
  RefreshCw,
  Flame
} from 'lucide-react';

interface DashboardMainProps {
  categories: CategorySummary[];
  positions: Position[];
  settings: TradingSettings;
  startingBalance: number;
  currentBalance: number;
  pnlDataPoints: PnLDataPoint[];
  onNavigateTab: (tabId: string) => void;
}

export default function DashboardMain({
  categories,
  positions,
  settings,
  startingBalance,
  currentBalance,
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
  const freeUsdt = Math.max(0, currentBalance - activeMargin);
  const marginUsedPercent = currentBalance > 0 ? (activeMargin / currentBalance) * 100 : 0;

  // Helper to map category ID to typed Lucide Icon
  const getAgentIcon = (catId: string): React.ComponentType<{ className?: string }> => {
    switch (catId) {
      case 'l1-mainstream': return TrendingUp;
      case 'l2-rollups': return Activity;
      case 'ai-big-data': return Target;
      case 'defi-protocols': return Zap;
      case 'meme-coins': return Shield;
      case 'gaming-metaverse': return BarChart2;
      case 'rwa-payments': return Layers;
      case 'infra-depin': return Cpu;
      case 'crosschain-interop': return RefreshCw;
      case 'max-movers-volatility': return Flame;
      default: return Zap;
    }
  };

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

  // User toggle for Swarm Radar fleet: default false (shows ONLY bots with open running positions)
  const [showAllFleet, setShowAllFleet] = React.useState(false);

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
  // Show ONLY running position bots by default (or all fleet if toggled or if 0 positions exist)
  const displayAgents = showAllFleet ? agentsWithPositions : (activeBotAgents.length > 0 ? activeBotAgents : agentsWithPositions);
  const isShowingOnlyActive = !showAllFleet && activeBotAgents.length > 0;

  return (
    <div className="space-y-5 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Status Alert Bar with Smooth Motion */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 shadow-inner font-mono text-xs flex flex-wrap items-center justify-between gap-3"
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
              {settings.apiKey ? 'Configured' : 'Binance USDT-M Demo'}
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
            <span className="text-amber-400 font-bold">PMax + Pro Scalper</span>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('settings')}
          className="text-[11px] text-amber-400/90 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer font-mono"
        >
          <span>Settings & API keys</span>
        </button>
      </motion.div>

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
              {showAllFleet ? 'Show Running Positions Only' : 'Show All 10 Fleet'}
            </button>
          </div>

          {/* Motion Graphic: Rotating 360° Radar Sweep Beam */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] sm:w-[660px] sm:h-[660px] rounded-full pointer-events-none z-0 opacity-25"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.45) 0deg, rgba(6, 182, 212, 0) 65deg, transparent 360deg)'
            }}
          />

          {/* Motion Graphic: Concentric Radar Orbit Rings with Expanded Distance */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] sm:w-[620px] sm:h-[620px] rounded-full border border-cyan-500/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[460px] sm:h-[460px] rounded-full border border-cyan-500/30 pointer-events-none border-dashed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[260px] sm:h-[260px] rounded-full border border-cyan-400/40 pointer-events-none" />

          {/* Motion Graphic: Expanding Energy Pulse Rings */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.35, 0.1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] sm:w-[580px] sm:h-[580px] rounded-full border border-cyan-400/30 pointer-events-none"
          />

          {/* SVG Overlay: High-Tech Radial Plasma Beams Connecting Core to Orbit Nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 1000" preserveAspectRatio="none">
            {displayAgents.map((agent, index) => {
              const angleDeg = (index * 360 / displayAgents.length) - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const cos = Math.cos(angleRad);
              const sin = Math.sin(angleRad);
              const xEnd = 500 + cos * 430;
              const yEnd = 500 + sin * 430;

              return (
                <g key={`beam-${agent.catId}`}>
                  {/* Glowing background laser beam line */}
                  <line
                    x1="500"
                    y1="500"
                    x2={xEnd}
                    y2={yEnd}
                    stroke={agent.isOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(6, 182, 212, 0.15)'}
                    strokeWidth={agent.isOpen ? '3' : '2'}
                  />
                  {/* Motion animated energy laser pulse line */}
                  <motion.line
                    x1="500"
                    y1="500"
                    x2={xEnd}
                    y2={yEnd}
                    stroke={agent.isOpen ? 'rgba(52, 211, 153, 0.95)' : 'rgba(56, 189, 248, 0.85)'}
                    strokeWidth={agent.isOpen ? '2.5' : '1.8'}
                    strokeDasharray="6 18"
                    animate={{ strokeDashoffset: [0, -48] }}
                    transition={{ repeat: Infinity, duration: 1.8 + (index % 3) * 0.4, ease: 'linear' }}
                  />
                  {/* End Particle Node */}
                  <circle
                    cx={xEnd}
                    cy={yEnd}
                    r={agent.isOpen ? '3.5' : '2.5'}
                    fill={agent.isOpen ? '#34d399' : '#38bdf8'}
                  />
                </g>
              );
            })}
          </svg>

          {/* Central Monorid Swarm Radar Content Container */}
          <div className="relative z-10 flex-1 flex items-center justify-center min-h-[540px] sm:min-h-[600px] my-2">
            {/* Center Monorid Hub Card - Exact Match to Reference Dashboard Graphics */}
            <motion.div 
              animate={{ y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateTab('scanner')}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-slate-900/95 border-2 border-cyan-500/80 hover:border-cyan-400 p-3.5 sm:p-4 rounded-2xl text-center shadow-2xl shadow-cyan-500/30 backdrop-blur-md cursor-pointer transition-all group w-[140px] sm:w-[160px]"
            >
              {/* Outer Glowing Energy Halo */}
              <motion.div 
                animate={{ opacity: [0.4, 0.85, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/40 via-blue-500/30 to-emerald-500/40 blur-md -z-10 pointer-events-none"
              />

              {/* Monorid 'M' Icon Badge */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto rounded-xl bg-slate-950 border border-cyan-400/80 flex items-center justify-center text-cyan-400 font-black text-2xl shadow-lg shadow-cyan-500/30 mb-2 relative overflow-hidden group-hover:border-cyan-300">
                <span className="relative z-10 drop-shadow-md">M</span>
                <motion.div 
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none"
                />
              </div>

              <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wider font-mono">
                MONORID QUANT
              </h3>

              <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400">
                <motion.span 
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400" 
                />
                <span>FLEET ONLINE (10/10)</span>
              </div>

              <div className="mt-1.5 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[9px] font-mono text-cyan-400 font-bold flex items-center justify-center gap-1 shadow-inner">
                <span>{activeBotAgents.length} IN POSITION</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400">1.8s CYCLE</span>
              </div>
            </motion.div>

            {/* Orbiting Bot Nodes: Rounded-xl Cards with Top Glowing Icon Box & Scan Pill */}
            {displayAgents.map((agent, index) => {
              const cat = categories.find(c => c.id === agent.catId);
              const avgChange = cat ? cat.avgChange24h : 0;
              const isPos = avgChange >= 0;

              const openPos = agent.openPositions[0]; // First open position if running
              const IconComp = getAgentIcon(agent.catId);

              const angleDeg = (index * 360 / displayAgents.length) - 90;
              const angleRad = (angleDeg * Math.PI) / 180;
              const cos = Math.cos(angleRad);
              const sin = Math.sin(angleRad);

              return (
                <motion.div
                  key={agent.catId}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: index % 2 === 0 ? [-3, 3, -3] : [3, -3, 3]
                  }}
                  transition={{ 
                    opacity: { duration: 0.4, delay: index * 0.04 },
                    scale: { duration: 0.4, delay: index * 0.04 },
                    y: { repeat: Infinity, duration: 3.5 + (index % 3) * 0.5, ease: 'easeInOut' }
                  }}
                  whileHover={{ scale: 1.1, zIndex: 30 }}
                  onClick={() => onNavigateTab('scanner')}
                  style={{
                    position: 'absolute',
                    left: `calc(50% + (${cos.toFixed(4)} * clamp(195px, 26vw, 265px)))`,
                    top: `calc(50% + (${sin.toFixed(4)} * clamp(195px, 26vw, 265px)))`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`z-10 rounded-xl w-[120px] sm:w-[130px] p-2.5 text-center cursor-pointer transition-all shadow-xl backdrop-blur-md group relative border ${
                    agent.isOpen 
                      ? 'bg-slate-900/95 border-emerald-400/90 shadow-[0_0_20px_rgba(52,211,153,0.3)]' 
                      : 'bg-slate-900/90 hover:bg-slate-900 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  {/* Glowing Top Icon Box */}
                  <div className="w-8 h-8 mx-auto rounded-lg bg-slate-950 border border-cyan-500/60 flex items-center justify-center text-cyan-400 mb-1.5 shadow-md group-hover:border-cyan-300">
                    <IconComp className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Bot Name / Symbol Display */}
                  <h4 className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1 font-sans">
                    {openPos ? openPos.symbol : agent.name}
                  </h4>

                  {/* Running Position or Scan Pill */}
                  {openPos ? (
                    <div className="mt-1 font-mono text-[9px] flex flex-col items-center gap-0.5">
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] ${
                        openPos.side === 'LONG' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      }`}>
                        {openPos.side} {openPos.leverage}x
                      </span>
                      <span className={`font-bold ${openPos.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {openPos.netPnl >= 0 ? '+' : ''}${openPos.netPnl.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-center gap-1 font-mono text-[9px] bg-slate-950/80 border border-slate-800/80 py-0.5 px-1.5 rounded">
                      <span className="text-cyan-400/80 text-[8px] uppercase">SCAN 5M</span>
                      <span className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}{avgChange.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
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
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4"
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
          </motion.div>

          {/* Card 2: Performance Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl space-y-4 flex-1 flex flex-col justify-between"
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
