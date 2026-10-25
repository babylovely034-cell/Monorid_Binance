'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Layers, 
  Sliders, 
  History, 
  FileText, 
  Settings, 
  Wifi, 
  Copy, 
  Check, 
  TrendingUp, 
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';
import { WsConnectionStatus } from '@/lib/binanceWs';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wsStatus: WsConnectionStatus;
  userIp: string;
  startingBalance: number;
  currentBalance: number;
  totalNetPnl: number;
  totalNetPnlPercent: number;
  openPositionsCount: number;
  autoTrading: boolean;
  onToggleAutoTrading: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  wsStatus,
  userIp,
  startingBalance,
  currentBalance,
  totalNetPnl,
  totalNetPnlPercent,
  openPositionsCount,
  autoTrading,
  onToggleAutoTrading,
}: NavbarProps) {
  const [copiedIp, setCopiedIp] = useState(false);

  const copyIpToClipboard = () => {
    if (userIp) {
      navigator.clipboard.writeText(userIp);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  const isLowBalance = currentBalance <= 1.20;

  const getStatusBadge = () => {
    switch (wsStatus) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WS LIVE
          </span>
        );
      case 'FALLBACK_SIMULATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-3 h-3 animate-spin text-cyan-400" />
            STREAM SIM
          </span>
        );
      case 'CONNECTING':
      case 'RECONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/80 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            CONNECTING...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/80 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            OFFLINE
          </span>
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'scanner', label: 'Market Scanner', icon: Layers },
    { id: 'positions', label: `Positions (${openPositionsCount})`, icon: Zap },
    { id: 'history', label: 'Performance', icon: History },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-400/30">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  Monorid
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  USDT-M
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  5m TF
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                PMax & Pro Scalper AI (1:2 RR Swing Strategy)
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="hidden md:flex items-center gap-3">
            {/* IPv4 Whitelist Fast Copy Pill */}
            <button
              onClick={copyIpToClipboard}
              title="Click to copy IPv4 address for Binance Whitelist"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono transition-colors group cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-400">IPv4:</span>
              <span>{userIp || '104.28.192.45'}</span>
              {copiedIp ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
              )}
            </button>

            {/* Starting Balance & Current Balance Display */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 font-mono text-xs">
              <span className="text-slate-500">Start:</span>
              <span className="text-slate-300 font-bold">${startingBalance.toFixed(2)}</span>
              <span className="text-slate-700">|</span>
              <span className="text-slate-500">Balance:</span>
              <span className={`font-bold ${isLowBalance ? 'text-rose-400' : 'text-white'}`}>
                ${currentBalance.toFixed(2)}
              </span>
              <span className={`text-[11px] font-bold ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ({totalNetPnl >= 0 ? '+' : ''}{totalNetPnlPercent.toFixed(1)}%)
              </span>
            </div>

            {/* Reserve Buffer Status */}
            {isLowBalance ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 animate-pulse">
                WAITING FOR BALANCE (&lt;$1.20)
              </span>
            ) : (
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                $1.20 Reserve Safe
              </span>
            )}

            {/* WebSocket Status */}
            {getStatusBadge()}
          </div>

          {/* Auto-Trading Execution Switch & Mobile IP */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleAutoTrading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all cursor-pointer ${
                autoTrading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoTrading ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
              {autoTrading ? 'ALGO AUTO: ACTIVE' : 'ALGO AUTO: PAUSED'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/60 py-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
