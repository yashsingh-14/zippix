import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ColorVault } from './components/ColorVault';
import { TypographyVault } from './components/TypographyVault';
import { InspectorTab } from './components/InspectorTab';
import { AssetGallery } from './components/AssetGallery';
import { ExporterTab } from './components/ExporterTab';
import { Palette, Crosshair, Image as ImageIcon, FileCode2 } from 'lucide-react';
import type { DesignTokens, InspectedElement, ExtensionMessage } from '../types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'design' | 'inspector' | 'assets' | 'export'>('design');
  const [designSubTab, setDesignSubTab] = useState<'colors' | 'typography'>('colors');
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Scan current active tab
  const scanCurrentTab = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        setError('No active tab found.');
        setIsLoading(false);
        return;
      }

      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://') || tab.url?.startsWith('about:')) {
        setError('Chrome internal pages cannot be inspected.');
        setIsLoading(false);
        return;
      }

      if (tab.url) {
        try {
          const urlObj = new URL(tab.url);
          setDomain(urlObj.hostname);
        } catch {
          setDomain(tab.url);
        }
      }

      // Try sending message to content script
      chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' }, (response) => {
        if (chrome.runtime.lastError || !response || response.status !== 'ok') {
          // If content script was not injected, inject it on the fly
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id! },
              files: ['content.js'],
            },
            () => {
              if (chrome.runtime.lastError) {
                setError('Could not inject into this page. Refresh the webpage and try again.');
                setIsLoading(false);
                return;
              }
              // Retry scan
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id!, { type: 'SCAN_PAGE' }, (retryRes) => {
                  if (retryRes && retryRes.tokens) {
                    setTokens(retryRes.tokens);
                  }
                  setIsLoading(false);
                });
              }, 200);
            }
          );
        } else {
          setTokens(response.tokens);
          setIsLoading(false);
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Error scanning page');
      setIsLoading(false);
    }
  }, []);

  // Toggle Inspect Mode
  const toggleInspect = useCallback(async () => {
    const nextState = !isInspecting;
    setIsInspecting(nextState);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, {
      type: nextState ? 'START_INSPECT' : 'STOP_INSPECT',
    });
  }, [isInspecting]);

  // Listen for messages from content script
  useEffect(() => {
    const messageHandler = (message: ExtensionMessage) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setInspectedElement(message.payload);
        setIsInspecting(false);
        setActiveTab('inspector'); // Auto-switch to inspector tab when user clicks an element!
      } else if (message.type === 'INSPECTOR_STATE_UPDATE') {
        setIsInspecting(message.payload.isInspecting);
      }
    };

    chrome.runtime.onMessage.addListener(messageHandler);
    return () => {
      chrome.runtime.onMessage.removeListener(messageHandler);
    };
  }, []);

  // Initial scan on load
  useEffect(() => {
    scanCurrentTab();
  }, [scanCurrentTab]);

  return (
    <div className="flex h-screen flex-col bg-[#0b0f19] text-slate-100 select-none">
      {/* Top Header */}
      <Header
        domain={domain}
        isInspecting={isInspecting}
        isLoading={isLoading}
        onToggleInspect={toggleInspect}
        onRefreshScan={scanCurrentTab}
      />

      {/* Main Tab Navigation Bar */}
      <nav className="flex border-b border-slate-800/80 bg-slate-950/40 px-2 pt-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('design')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition ${
            activeTab === 'design'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Design</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          className={`relative flex items-center gap-1.5 border-b-2 px-3 py-2 transition ${
            activeTab === 'inspector'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span>Inspector</span>
          {inspectedElement && (
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition ${
            activeTab === 'assets'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Assets</span>
          {tokens && tokens.assets.length > 0 && (
            <span className="rounded bg-slate-800 px-1 py-0.2 text-[9px] font-mono text-slate-400">
              {tokens.assets.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition ${
            activeTab === 'export'
              ? 'border-cyan-400 text-cyan-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode2 className="h-3.5 w-3.5" />
          <span>Export</span>
        </button>
      </nav>

      {/* Error notification */}
      {error && (
        <div className="m-3 rounded-lg border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 overflow-y-auto p-3.5">
        {isLoading && !tokens ? (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center text-slate-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mb-3" />
            <p className="text-xs">Scanning webpage design system...</p>
          </div>
        ) : (
          <>
            {activeTab === 'design' && (
              <div className="space-y-4">
                {/* Design Sub-navigation */}
                <div className="flex rounded-lg bg-slate-900/80 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setDesignSubTab('colors')}
                    className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition ${
                      designSubTab === 'colors'
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Colors ({tokens?.colors.length || 0})
                  </button>
                  <button
                    onClick={() => setDesignSubTab('typography')}
                    className={`flex-1 rounded-md py-1 text-center text-xs font-medium transition ${
                      designSubTab === 'typography'
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Typography ({tokens?.fonts.length || 0})
                  </button>
                </div>

                {designSubTab === 'colors' ? (
                  <ColorVault colors={tokens?.colors || []} />
                ) : (
                  <TypographyVault fonts={tokens?.fonts || []} />
                )}
              </div>
            )}

            {activeTab === 'inspector' && (
              <InspectorTab
                element={inspectedElement}
                isInspecting={isInspecting}
                onStartInspect={toggleInspect}
              />
            )}

            {activeTab === 'assets' && (
              <AssetGallery
                assets={tokens?.assets || []}
                tokens={tokens || undefined}
              />
            )}

            {activeTab === 'export' && tokens && (
              <ExporterTab tokens={tokens} element={inspectedElement} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
