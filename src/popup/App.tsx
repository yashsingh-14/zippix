import React, { useState, useEffect } from 'react';
import { Layers, Sidebar, Crosshair, ArrowRight } from 'lucide-react';

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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-md shadow-cyan-500/20">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white">Woblo Pro</span>
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
