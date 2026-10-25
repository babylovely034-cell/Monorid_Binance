'use client';

import React, { useState } from 'react';
import { LogEntry } from '@/lib/types';
import { formatUtcTime } from '@/lib/formatters';
import { 
  FileText, 
  Trash2, 
  Filter, 
  Search, 
  Terminal, 
  ArrowDown, 
  Layers, 
  Zap, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  Radio
} from 'lucide-react';

interface LogsViewProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export default function LogsView({ logs, onClearLogs }: LogsViewProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter(log => {
    if (selectedType !== 'ALL' && log.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchSymbol = log.symbol?.toLowerCase().includes(q);
      const matchCat = log.category?.toLowerCase().includes(q);
      if (!matchMsg && !matchSymbol && !matchCat) return false;
    }
    return true;
  });

  const getTypeBadge = (type: LogEntry['type']) => {
    switch (type) {
      case 'EXECUTION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'TP_SL':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'SCANNER':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'FEES':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'WEBSOCKET':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityIndicator = (severity: LogEntry['severity']) => {
    switch (severity) {
      case 'SUCCESS':
        return <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />;
      case 'WARNING':
        return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />;
      case 'ERROR':
        return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <span>Real-Time System & Algo Audit Logs</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete chronological audit trail of market scanning, qualification changes, trade executions, TP/SL triggers, and Binance fee records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto font-mono text-xs">
            {['ALL', 'EXECUTION', 'TP_SL', 'SCANNER', 'FEES', 'WEBSOCKET'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  selectedType === t
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {t === 'ALL' ? 'All Events' : t}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search in audit log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow font-mono text-xs">
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Audit Stream Active</span>
          </span>
          <span>{filteredLogs.length} Records</span>
        </div>

        <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-800/40 p-1">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-600">
              No audit log entries matching the criteria.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="py-2.5 px-3 hover:bg-slate-900/60 transition-colors flex items-start gap-3"
              >
                {/* Timestamp */}
                <span className="text-slate-500 text-[11px] whitespace-nowrap shrink-0 pt-0.5 font-mono">
                  {formatUtcTime(log.timestamp)}
                </span>

                {/* Severity indicator */}
                <div className="pt-1.5">
                  {getSeverityIndicator(log.severity)}
                </div>

                {/* Type Badge */}
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getTypeBadge(log.type)}`}>
                  {log.type}
                </span>

                {/* Symbol Tag if present */}
                {log.symbol && (
                  <span className="text-amber-400 font-bold shrink-0">
                    [{log.symbol}]
                  </span>
                )}

                {/* Log Message */}
                <div className="text-slate-200 flex-1 break-words">
                  {log.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
