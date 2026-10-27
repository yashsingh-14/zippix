import React from 'react';
import { Crosshair, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  domain: string;
  isInspecting: boolean;
  isLoading: boolean;
  onToggleInspect: () => void;
  onRefreshScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  domain,
  isInspecting,
  isLoading,
  onToggleInspect,
  onRefreshScan,
}) => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">Woblo</span>
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
              PRO
            </span>
          </div>
          <p className="max-w-[150px] truncate text-[11px] text-slate-400 font-mono">
            {domain || 'No active page'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleInspect}
          title={isInspecting ? 'Stop inspecting (ESC)' : 'Inspect an element on page'}
          className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
            isInspecting
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-semibold'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
          }`}
        >
          {isInspecting && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </span>
          )}
          <Crosshair className={`h-3.5 w-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
          <span>{isInspecting ? 'Inspecting...' : 'Inspect'}</span>
        </button>

        <button
          onClick={onRefreshScan}
          disabled={isLoading}
          title="Rescan current page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
