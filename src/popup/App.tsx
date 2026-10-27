import React, { useState, useEffect } from 'react';
import { Sidebar, Crosshair, ArrowRight } from 'lucide-react';

const ZippixLogo: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="popGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <filter id="popGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#06b6d4" floodOpacity="0.4" />
      </filter>
    </defs>
    <rect x="8" y="8" width="112" height="112" rx="28" fill="#0f172a" stroke="url(#popGrad)" strokeWidth="4" filter="url(#popGlow)" />
    <polygon points="64,26 96,44 64,62 32,44" fill="url(#popGrad)" opacity="0.95" />
    <polygon points="64,48 96,66 64,84 32,66" fill="#38bdf8" opacity="0.8" />
    <polygon points="64,70 96,88 64,106 32,88" fill="#818cf8" opacity="0.9" />
    <circle cx="64" cy="44" r="3.5" fill="#ffffff" />
  </svg>
);

export const App: React.FC = () => {
  const [domain, setDomain] = useState('');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.url) {
        try {
          setDomain(new URL(tab.url).hostname);
        } catch {
          setDomain(tab.url);
        }
      }
    });
  }, []);

  const handleOpenSidePanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const handleStartInspect = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_INSPECT' });
      if (chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
      window.close();
    }
  };

  return (
    <div className="w-[300px] bg-[#0b0f19] p-4 text-slate-100 font-sans select-none">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
        <ZippixLogo className="h-8 w-8 drop-shadow-md" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white">Zippix</span>
            <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-cyan-400 border border-cyan-500/20">
              PRO
            </span>
          </div>
          <p className="truncate text-[10px] text-slate-400 font-mono">{domain || 'Active Tab'}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={handleOpenSidePanel}
          className="flex w-full items-center justify-between rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:opacity-95 transition"
        >
          <div className="flex items-center gap-2">
            <Sidebar className="h-4 w-4" />
            <span>Open Side Panel</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={handleStartInspect}
          className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-cyan-400" />
            <span>Inspect Element</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
        </button>
      </div>

      <p className="mt-4 text-center text-[10px] text-slate-500">
        Extract colors, fonts, SVGs & generate AI prompts
      </p>
    </div>
  );
};
