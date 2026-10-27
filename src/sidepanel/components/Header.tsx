import React from 'react';
import { Crosshair, RefreshCw } from 'lucide-react';

export const ZippixLogo: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zippixLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <filter id="zippixGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="8" y="8" width="112" height="112" rx="28" fill="#0f172a" stroke="url(#zippixLogoGrad)" strokeWidth="4" filter="url(#zippixGlow)" />
    <polygon points="64,26 96,44 64,62 32,44" fill="url(#zippixLogoGrad)" opacity="0.95" />
    <polygon points="64,48 96,66 64,84 32,66" fill="#38bdf8" opacity="0.8" />
    <polygon points="64,70 96,88 64,106 32,88" fill="#818cf8" opacity="0.9" />
    <circle cx="64" cy="44" r="3.5" fill="#ffffff" />
  </svg>
);

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
        <ZippixLogo className="h-8 w-8 drop-shadow-md" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">Zippix</span>
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
