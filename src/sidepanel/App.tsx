import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ColorVault } from './components/ColorVault';
import { TypographyVault } from './components/TypographyVault';
import { InspectorTab } from './components/InspectorTab';
import { AssetGallery } from './components/AssetGallery';
import { ExporterTab } from './components/ExporterTab';
import { ProModal } from './components/ProModal';
import { Sparkles, Palette, Type, Image as ImageIcon, Crosshair } from 'lucide-react';
import type { DesignTokens, InspectedElement, ExtensionMessage, LicenseState } from '../types';
import { getLicenseState } from '../utils/licenseManager';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'colors' | 'fonts' | 'assets' | 'inspect'>('export');
  const [tokens, setTokens] = useState<DesignTokens | null>(null);
  const [inspectedElement, setInspectedElement] = useState<InspectedElement | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [license, setLicense] = useState<LicenseState | null>(null);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  // Load and sync license state
  const loadLicense = useCallback(async () => {
    try {
      const state = await getLicenseState();
      setLicense(state);
    } catch (err) {
      console.error('Failed to load license state:', err);
    }
  }, []);

  useEffect(() => {
    loadLicense();
  }, [loadLicense]);

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
                setError('Could not inspect this page. Refresh the webpage and try again.');
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
        setActiveTab('inspect'); // Auto-switch to inspect tab when element selected
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
    <div className="flex h-screen flex-col bg-[#141413] text-[#faf9f5] select-none antialiased">
      {/* Top Header (Height 46px) */}
      <Header
        domain={domain}
        isInspecting={isInspecting}
        isLoading={isLoading}
        onToggleInspect={toggleInspect}
        onRefreshScan={scanCurrentTab}
        license={license}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      {/* Segmented Tab Navigation Bar (Height 38px) */}
      <nav className="flex h-[38px] items-center gap-1 border-b border-white/[0.08] bg-[#141413] px-2.5 overflow-x-auto shrink-0">
        {/* Clone Tab */}
        <button
          onClick={() => setActiveTab('export')}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition duration-150 shrink-0 ${
            activeTab === 'export'
              ? 'bg-white/[0.1] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-xs'
              : 'text-[#a8a29e] hover:text-[#faf9f5] hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span>Clone</span>
        </button>

        {/* Colors Tab */}
        <button
          onClick={() => setActiveTab('colors')}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition duration-150 shrink-0 ${
            activeTab === 'colors'
              ? 'bg-white/[0.1] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-xs'
              : 'text-[#a8a29e] hover:text-[#faf9f5] hover:bg-white/[0.04]'
          }`}
        >
          <Palette className="h-3 w-3" />
          <span>Colors</span>
          {tokens && tokens.colors.length > 0 && (
            <span className="text-[9.5px] font-mono text-[#78716c]">
              {tokens.colors.length}
            </span>
          )}
        </button>

        {/* Fonts Tab */}
        <button
          onClick={() => setActiveTab('fonts')}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition duration-150 shrink-0 ${
            activeTab === 'fonts'
              ? 'bg-white/[0.1] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-xs'
              : 'text-[#a8a29e] hover:text-[#faf9f5] hover:bg-white/[0.04]'
          }`}
        >
          <Type className="h-3 w-3" />
          <span>Fonts</span>
          {tokens && tokens.fonts.length > 0 && (
            <span className="text-[9.5px] font-mono text-[#78716c]">
              {tokens.fonts.length}
            </span>
          )}
        </button>

        {/* Assets Tab */}
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition duration-150 shrink-0 ${
            activeTab === 'assets'
              ? 'bg-white/[0.1] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-xs'
              : 'text-[#a8a29e] hover:text-[#faf9f5] hover:bg-white/[0.04]'
          }`}
        >
          <ImageIcon className="h-3 w-3" />
          <span>Assets</span>
          {tokens && tokens.assets.length > 0 && (
            <span className="text-[9.5px] font-mono text-[#78716c]">
              {tokens.assets.length}
            </span>
          )}
        </button>

        {/* Inspect Tab */}
        <button
          onClick={() => setActiveTab('inspect')}
          className={`relative flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition duration-150 shrink-0 ${
            activeTab === 'inspect'
              ? 'bg-white/[0.1] text-[#faf9f5] font-semibold border border-white/[0.12] shadow-xs'
              : 'text-[#a8a29e] hover:text-[#faf9f5] hover:bg-white/[0.04]'
          }`}
        >
          <Crosshair className="h-3 w-3" />
          <span>Inspect</span>
          {inspectedElement && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          )}
        </button>
      </nav>

      {/* Error notification */}
      {error && (
        <div className="m-3 rounded-lg border border-red-500/20 bg-red-950/30 p-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-3">
        {isLoading && !tokens ? (
          <div className="flex h-full flex-col items-center justify-center py-20 text-center text-[#a8a29e]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#faf9f5] mb-3" />
            <p className="text-xs font-medium text-[#a8a29e]">Scanning webpage design tokens...</p>
          </div>
        ) : (
          <>
            {activeTab === 'export' && (
              <ExporterTab
                tokens={tokens || { domain, title: 'Webpage', colors: [], fonts: [], assets: [], shadows: [], radii: [], extractedAt: new Date().toISOString() }}
                element={inspectedElement}
                license={license}
                onRequirePro={() => setIsProModalOpen(true)}
                onCloneUsed={loadLicense}
              />
            )}

            {activeTab === 'colors' && (
              <ColorVault colors={tokens?.colors || []} />
            )}

            {activeTab === 'fonts' && (
              <TypographyVault fonts={tokens?.fonts || []} />
            )}

            {activeTab === 'assets' && (
              <AssetGallery
                assets={tokens?.assets || []}
                tokens={tokens || undefined}
              />
            )}

            {activeTab === 'inspect' && (
              <InspectorTab
                element={inspectedElement}
                isInspecting={isInspecting}
                onStartInspect={toggleInspect}
              />
            )}
          </>
        )}
      </main>

      {/* Luxury Pro Upgrade & License Key Activation Modal */}
      {license && (
        <ProModal
          isOpen={isProModalOpen}
          onClose={() => setIsProModalOpen(false)}
          license={license}
          onLicenseUpdated={loadLicense}
        />
      )}
    </div>
  );
};
