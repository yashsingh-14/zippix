import React from 'react';
import { Crosshair, RefreshCw, Sparkles } from 'lucide-react';
import type { LicenseState } from '../../types';

export const ZippixLogo: React.FC<{ className?: string }> = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="zippixLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#c084fc" />
      </linearGradient>
    </defs>
    <rect x="10" y="10" width="108" height="108" rx="26" fill="#1c1b1a" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
    <polygon points="64,28 94,45 64,62 34,45" fill="url(#zippixLogoGrad)" opacity="0.95" />
    <polygon points="64,49 94,66 64,83 34,66" fill="#38bdf8" opacity="0.8" />
    <polygon points="64,70 94,87 64,104 34,87" fill="#818cf8" opacity="0.9" />
    <circle cx="64" cy="45" r="3" fill="#ffffff" />
  </svg>
);

interface HeaderProps {
  domain: string;
  isInspecting: boolean;
  isLoading: boolean;
  onToggleInspect: () => void;
  onRefreshScan: () => void;
  license?: LicenseState | null;
  onOpenProModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  domain,
  isInspecting,
  isLoading,
  onToggleInspect,
  onRefreshScan,
  license,
  onOpenProModal,
}) => {
  return (
    <header className="sticky top-0 z-50 flex h-[46px] items-center justify-between border-b border-white/[0.08] bg-[#141413]/95 px-3 backdrop-blur-md">
      {/* Brand & Active Domain */}
      <div className="flex items-center gap-2 min-w-0">
        <ZippixLogo className="h-5 w-5 shrink-0" />
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13px] font-bold tracking-tight text-[#faf9f5]">Zippix</span>
          {domain && (
            <span className="truncate max-w-[110px] rounded-md bg-white/[0.05] border border-white/[0.07] px-1.5 py-0.5 font-mono text-[10px] text-[#a8a29e]">
              {domain}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls & Pro Badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        {license?.isPro ? (
          <button
            onClick={onOpenProModal}
            title="Zippix Pro Lifetime Active"
            className="flex h-6 items-center gap-1 rounded bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 px-2 text-[10px] font-bold text-amber-300 hover:border-amber-400 transition"
          >
            <Sparkles className="h-2.5 w-2.5 fill-amber-300" />
            <span>PRO</span>
          </button>
        ) : (
          <button
            onClick={onOpenProModal}
            className="flex h-6 items-center gap-1 rounded bg-amber-500 hover:bg-amber-400 text-black px-2 text-[10px] font-bold shadow-xs transition"
          >
            <Sparkles className="h-2.5 w-2.5 fill-black" />
            <span>PRO</span>
          </button>
        )}

        <button
          onClick={onToggleInspect}
          title={isInspecting ? 'Stop inspecting (ESC)' : 'Inspect elements on page'}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-all duration-150 ${
            isInspecting
              ? 'bg-[#faf9f5] text-[#141413] shadow-xs font-semibold'
              : 'bg-white/[0.06] hover:bg-white/[0.1] text-[#faf9f5] border border-white/[0.08]'
          }`}
        >
          <Crosshair className={`h-3 w-3 ${isInspecting ? 'animate-spin' : ''}`} />
          <span>{isInspecting ? 'Inspecting' : 'Inspect'}</span>
        </button>

        <button
          onClick={onRefreshScan}
          disabled={isLoading}
          title="Rescan webpage"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[#a8a29e] hover:text-[#faf9f5] transition duration-150 disabled:opacity-40"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin text-[#faf9f5]' : ''}`} />
        </button>
      </div>
    </header>
  );
};

