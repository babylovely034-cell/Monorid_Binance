'use client';

import React, { useState } from 'react';
import { TradingSettings } from '@/lib/types';
import { 
  Settings, 
  Key, 
  ShieldCheck, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  DollarSign, 
  Percent, 
  Lock,
  Save,
  Radio,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  settings: TradingSettings;
  userIp: string;
  onSaveSettings: (newSettings: TradingSettings) => void;
  onTestApiConnection: () => Promise<boolean>;
}

export default function SettingsView({
  settings,
  userIp,
  onSaveSettings,
  onTestApiConnection,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<TradingSettings>({ ...settings });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopyIp = () => {
    if (userIp) {
      navigator.clipboard.writeText(userIp);
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/binance/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: formData.apiKey,
          apiSecret: formData.apiSecret
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || `Connected to Binance Futures! Latency: ${data.pingMs || 0}ms.`
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || 'API Key or Secret is invalid or Binance Futures permission is not enabled.'
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || 'Connection test failed. Please verify network access.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>Dashboard & Binance API Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure your Binance USDT-M Futures API credentials, IP whitelisting, leverage, platform fee rates, and 1:2 RR risk execution parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: Client IPv4 Whitelisting (Prominent for faster whitelisting) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Your Whitelisted IPv4 Address</h3>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              IPv4 Protocol
            </span>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Detected Client / Applet IPv4:</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400 tracking-wider">
                {userIp || '104.28.192.45'}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Use this exact IPv4 address in Binance API Management under <em>&quot;Restrict access to trusted IPs only&quot;</em> for rapid whitelisting.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyIp}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-md shadow-emerald-900/40 transition-colors cursor-pointer shrink-0"
            >
              {copiedIp ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>COPIED TO CLIPBOARD</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-white" />
                  <span>COPY IPv4 FOR BINANCE</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Whitelisting Instructions Box */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 text-xs text-slate-300 space-y-1.5">
            <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
              How to Whitelist in Binance:
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] font-mono">
              <li>Open Binance → Profile → <strong className="text-white">API Management</strong>.</li>
              <li>Select your API Key → Click <strong className="text-white">Edit restrictions</strong>.</li>
              <li>Check <strong className="text-emerald-400">&quot;Enable Futures&quot;</strong> permission (Never enable &quot;Withdrawal&quot;).</li>
              <li>Under IP Access, choose <strong className="text-emerald-400">&quot;Restrict access to trusted IPs only (Recommended)&quot;</strong>.</li>
              <li>Paste the IPv4 address above and click Confirm.</li>
            </ol>
          </div>
        </div>

        {/* SECTION 2: Binance API Credentials */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Binance Futures API Credentials</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                PRODUCTION LIVE BINANCE FUTURES
              </span>
            </div>
          </div>

          {/* Execution Environment Info */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Execution Mode: Live Real Trading</span>
              <span className="text-[11px] text-slate-400">
                Direct order execution on Binance USDT-M Futures with automated Swing SL, 1:2 RR TP, and liquidation shield.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              REAL CAPITAL
            </span>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              Binance API Key:
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Paste your Binance USDT-M Futures API Key..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* API Secret */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-slate-300">
              Binance Secret Key:
            </label>
            <div className="relative">
              <input
                type={showApiSecret ? 'text' : 'password'}
                value={formData.apiSecret}
                onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                placeholder="Paste your Binance USDT-M Futures Secret Key..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowApiSecret(!showApiSecret)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test API Key Button */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              <Radio className={`w-3.5 h-3.5 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Connectivity...' : 'Test Binance API Connection'}</span>
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              testResult.success
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/30 text-rose-300'
            }`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* SECTION 2.5: Auto-Shield Running Trade Protection */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Auto-Shield Running Trade Protection</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoShieldEnabled !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, autoShieldEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Automatically monitors all running trades on Binance Futures. Any open position detected without a Stop Loss or Take Profit will automatically have protective 1:2 RR TP/SL orders placed on Binance.
          </p>
        </div>

        {/* SECTION 3: Strictly Locked Strategy Parameters (Autonomous & Non-Editable) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">System Locked Strategy Rules (Autonomous & Non-Editable)</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-bold">
              Algo Enforced
            </span>
          </div>

          <p className="text-xs text-slate-400">
            To guarantee execution consistency and capital protection, all core trading rules are hardcoded and non-editable.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs font-mono">
            {/* Rule 1: Timeframe */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Trading Timeframe</span>
              <span className="text-amber-400 font-bold text-sm">5 Minutes (5m TF)</span>
              <p className="text-[10px] text-slate-400">Fixed candle timeframe for PMax & Pro Scalper AI confirmation.</p>
            </div>

            {/* Rule 2: Fixed Starting Balance Baseline */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Starting Balance Baseline</span>
              <span className="text-white font-bold text-sm">${settings.startingBalance?.toFixed(2) || '100.00'} USDT</span>
              <p className="text-[10px] text-slate-400">Locked once on 1st balance. Never changes; benchmarks actual return.</p>
            </div>

            {/* Rule 3: $1.20 Minimum Buffer */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Minimum Reserve Buffer</span>
              <span className="text-emerald-400 font-bold text-sm">$1.20 USDT Reserved</span>
              <p className="text-[10px] text-slate-400">If balance &le; $1.20, no trades execute. Waits for balance available.</p>
            </div>

            {/* Rule 4: Position Sizing 10% */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Position Allocation</span>
              <span className="text-cyan-400 font-bold text-sm">10% Available Balance</span>
              <p className="text-[10px] text-slate-400">Each trade allocates exactly 10% of usable funds for steady compounding.</p>
            </div>

            {/* Rule 5: Dynamic Leverage 10x-15x */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Dynamic Leverage</span>
              <span className="text-amber-400 font-bold text-sm">10x to 15x Signal-Based</span>
              <p className="text-[10px] text-slate-400">Best high-conviction signal: 15x. Good standard signal: 10x.</p>
            </div>

            {/* Rule 6: Liquidation Shield */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Liquidation Shield</span>
              <span className="text-emerald-400 font-bold text-sm">Strict Auto-Avoid</span>
              <p className="text-[10px] text-slate-400">If Swing SL exceeds estimated liquidation price, trade is blocked.</p>
            </div>

            {/* Rule 7: Stop Loss Swing Levels */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Stop Loss Engine</span>
              <span className="text-rose-400 font-bold text-sm">Recent Swing Low / High</span>
              <p className="text-[10px] text-slate-400">Swing Low for Longs, Swing High for Shorts based on 5m lookback.</p>
            </div>

            {/* Rule 8: 1:2 RR Take Profit */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Take Profit Target</span>
              <span className="text-emerald-400 font-bold text-sm">1:2 Risk-to-Reward</span>
              <p className="text-[10px] text-slate-400">TP target is strictly fixed at 2× the distance from Entry to Swing SL.</p>
            </div>

            {/* Rule 9: Exit Discipline */}
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Exit Condition</span>
              <span className="text-white font-bold text-sm">TP or SL ONLY</span>
              <p className="text-[10px] text-slate-400">Trades close strictly upon hitting TP or SL. Manual closing disabled.</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Binance Keys Saved Successfully!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer font-mono"
          >
            <Save className="w-4 h-4" />
            <span>Save Binance API Keys</span>
          </button>
        </div>
      </form>
    </div>
  );
}
