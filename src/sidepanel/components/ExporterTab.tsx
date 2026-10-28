import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Archive, FileCode2, Loader2, Sparkles, CheckCircle2, Layers, Cpu, ShieldCheck } from 'lucide-react';
import type { DesignTokens, InspectedElement, LicenseState } from '../../types';
import {
  generateStandaloneHtml,
  generateComponentHtml,
  generateTailwindV3,
  generateTailwindV4,
  generateCssVariables,
  generateDesignTokensJson,
} from '../../utils/tokenGenerators';
import { triggerDownload, exportCloneZip } from '../../utils/zipExporter';
import { cloneFullPageHtml } from '../../content/cloner';
import { checkClonePermission, incrementCloneUsage } from '../../utils/licenseManager';

interface ExporterTabProps {
  tokens: DesignTokens;
  element?: InspectedElement | null;
  license?: LicenseState | null;
  onRequirePro?: () => void;
  onCloneUsed?: () => void;
}

export const ExporterTab: React.FC<ExporterTabProps> = ({
  tokens,
  element,
  license,
  onRequirePro,
  onCloneUsed,
}) => {
  const [format, setFormat] = useState<'html' | 'component' | 'tailwind4' | 'tailwind3' | 'css' | 'tokens_doc'>('html');
  const [copied, setCopied] = useState(false);
  const [liveCloneHtml, setLiveCloneHtml] = useState<string>(tokens.fullPageHtml || '');
  const [isCloning, setIsCloning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isDownloadingHtml, setIsDownloadingHtml] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Directly clone the active tab DOM in real-time
  useEffect(() => {
    setIsCloning(true);
    if (tokens.fullPageHtml) {
      setLiveCloneHtml(tokens.fullPageHtml);
    }

    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_LIVE_CLONE' }, (response) => {
          if (!chrome.runtime.lastError && response?.status === 'ok' && response.html) {
            setLiveCloneHtml(response.html);
            setIsCloning(false);
          } else {
            // Scripting fallback
            chrome.scripting
              .executeScript({
                target: { tabId: tab.id! },
                func: cloneFullPageHtml,
              })
              .then(([res]) => {
                if (res?.result) {
                  setLiveCloneHtml(res.result);
                }
                setIsCloning(false);
              })
              .catch(() => {
                setIsCloning(false);
              });
          }
        });
      } else {
        setIsCloning(false);
      }
    });
  }, [tokens.fullPageHtml]);

  const getExportCode = () => {
    switch (format) {
      case 'html':
        return {
          code: liveCloneHtml || tokens.fullPageHtml || '<!DOCTYPE html>\n<html><body>Capturing live page clone...</body></html>',
          filename: 'index.html',
          mime: 'text/html',
        };
      case 'component':
        return {
          code: element?.cloneHtml || (element ? generateComponentHtml(element, tokens) : '<!-- Select an element with Inspector first -->'),
          filename: `${element?.tagName.toLowerCase() || 'component'}.html`,
          mime: 'text/html',
        };
      case 'tailwind4':
        return {
          code: generateTailwindV4(tokens),
          filename: 'theme.css',
          mime: 'text/css',
        };
      case 'tailwind3':
        return {
          code: generateTailwindV3(tokens),
          filename: 'tailwind.config.js',
          mime: 'application/javascript',
        };
      case 'css':
        return {
          code: generateCssVariables(tokens),
          filename: 'variables.css',
          mime: 'text/css',
        };
      case 'tokens_doc':
        return {
          code: generateStandaloneHtml(tokens, element),
          filename: 'design-tokens-overview.html',
          mime: 'text/html',
        };
    }
  };

  const { code, filename, mime } = getExportCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const showSuccessNotice = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1-Click ZIP Package Download (Exact Woblo package structure)
  const handleDownloadZipPackage = async () => {
    const perm = await checkClonePermission();
    if (!perm.allowed) {
      onRequirePro?.();
      return;
    }

    setIsZipping(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_PAGE_ZIP' }, async (response) => {
          if (chrome.runtime.lastError || response?.status !== 'ok') {
            const fullHtml = liveCloneHtml || tokens.fullPageHtml || '';
            const zipBlob = await exportCloneZip(fullHtml, tokens.domain || 'page-clone');
            const safeDomain = (tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-');
            triggerDownload(zipBlob, `${safeDomain}.full-page.Zippix.zip`);
          }
          if (!perm.isPro) {
            await incrementCloneUsage();
            onCloneUsed?.();
          }
          setIsZipping(false);
          showSuccessNotice('ZIP package downloaded successfully!');
        });
      } else {
        const fullHtml = liveCloneHtml || tokens.fullPageHtml || '';
        const zipBlob = await exportCloneZip(fullHtml, tokens.domain || 'page-clone');
        const safeDomain = (tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-');
        triggerDownload(zipBlob, `${safeDomain}.full-page.Zippix.zip`);
        if (!perm.isPro) {
          await incrementCloneUsage();
          onCloneUsed?.();
        }
        setIsZipping(false);
        showSuccessNotice('ZIP package downloaded successfully!');
      }
    } catch (e) {
      console.error('Failed to create clone zip:', e);
      setIsZipping(false);
    }
  };

  // 1-Click Standalone HTML Download (Inlined styles & base64 images)
  const handleDownloadStandaloneHtml = async () => {
    const perm = await checkClonePermission();
    if (!perm.allowed) {
      onRequirePro?.();
      return;
    }

    setIsDownloadingHtml(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_PAGE_HTML' }, async (response) => {
          if (chrome.runtime.lastError || response?.status !== 'ok') {
            const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
            triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
          }
          if (!perm.isPro) {
            await incrementCloneUsage();
            onCloneUsed?.();
          }
          setIsDownloadingHtml(false);
          showSuccessNotice('Standalone HTML downloaded!');
        });
      } else {
        const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
        triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
        if (!perm.isPro) {
          await incrementCloneUsage();
          onCloneUsed?.();
        }
        setIsDownloadingHtml(false);
        showSuccessNotice('Standalone HTML downloaded!');
      }
    } catch {
      const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
      triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
      if (!perm.isPro) {
        await incrementCloneUsage();
        onCloneUsed?.();
      }
      setIsDownloadingHtml(false);
      showSuccessNotice('Standalone HTML downloaded!');
    }
  };

  const handleDownloadCodeFile = () => {
    const blob = new Blob([code], { type: `${mime};charset=utf-8` });
    triggerDownload(blob, filename);
  };

  const formats = [
    { id: 'html', label: '1:1 HTML' },
    ...(element ? [{ id: 'component' as const, label: `<${element.tagName.toLowerCase()}>` }] : []),
    { id: 'tailwind4', label: 'Tailwind v4' },
    { id: 'tailwind3', label: 'Tailwind v3' },
    { id: 'css', label: 'CSS Variables' },
    { id: 'tokens_doc', label: 'Tokens Doc' },
  ] as const;

  return (
    <div className="space-y-3.5 pb-4">
      {/* Toast Alert */}
      {downloadSuccess && (
        <div className="flex h-8 items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 text-[11px] font-medium text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* HERO CARD: 1-Click Universal Page Clone */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3.5 space-y-3 shadow-xs">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-[12.5px] font-bold tracking-tight text-[#faf9f5]">
              Full Page Clone
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/[0.05] border border-white/[0.07] px-2 py-0.5 text-[9.5px] font-mono text-[#a8a29e]">
            {isCloning ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />
                <span>Capturing DOM...</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                <span>100% Fidelity Ready</span>
              </>
            )}
          </div>
        </div>

        {/* Plan / Clones Remaining Status */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#141413] px-2.5 py-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            {license?.isPro ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                <Sparkles className="h-3 w-3 fill-amber-300" />
                Unlimited Pro Plan Active
              </span>
            ) : (
              <span className="text-[10.5px] text-[#a8a29e]">
                Free Plan: <strong className="text-[#faf9f5]">{Math.max(0, (license?.freeClonesMax || 3) - (license?.freeClonesUsed || 0))}</strong> of {license?.freeClonesMax || 3} free clones remaining
              </span>
            )}
          </div>
          {!license?.isPro && (
            <button
              onClick={onRequirePro}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Get Unlimited →
            </button>
          )}
        </div>

        <p className="text-[11px] leading-relaxed text-[#a8a29e]">
          Exports the complete webpage with unified styles, offline base64 assets, auto-playing videos, and interactive animations.
        </p>

        {/* Feature Badges Row */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#78716c]">
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Unified CSS</span>
          <span>•</span>
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Base64 Images</span>
          <span>•</span>
          <span className="rounded bg-white/[0.04] px-1.5 py-0.5">Interactive Scripts</span>
        </div>

        {/* Action Buttons (Height 40px each, perfectly balanced) */}
        <div className="space-y-2 pt-1">
          {/* Primary ZIP Button */}
          <button
            onClick={handleDownloadZipPackage}
            disabled={isZipping || isCloning}
            className="flex h-10 w-full items-center justify-between rounded-lg bg-[#faf9f5] hover:bg-[#ffffff] active:scale-[0.99] text-[#141413] px-3 font-semibold text-[11.5px] shadow-sm transition-all duration-150 disabled:opacity-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isZipping ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#141413]" />
              ) : (
                <Archive className="h-4 w-4 text-[#141413]" />
              )}
              <span className="truncate">
                {isZipping ? 'Bundling ZIP Package...' : 'Download ZIP Package'}
              </span>
            </div>
            <span className="rounded bg-[#141413]/10 px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-[#141413] shrink-0">
              index.html + styles.css
            </span>
          </button>

          {/* Standalone HTML Button */}
          <button
            onClick={handleDownloadStandaloneHtml}
            disabled={isDownloadingHtml || isCloning}
            className="flex h-10 w-full items-center justify-between rounded-lg bg-[#242220] hover:bg-[#2c2a28] active:scale-[0.99] border border-white/[0.08] text-[#faf9f5] px-3 font-medium text-[11.5px] transition-all duration-150 disabled:opacity-50"
          >
            <div className="flex items-center gap-2 min-w-0">
              {isDownloadingHtml ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#faf9f5]" />
              ) : (
                <FileCode2 className="h-4 w-4 text-[#a8a29e]" />
              )}
              <span className="truncate">
                {isDownloadingHtml ? 'Compiling Single HTML...' : 'Download Standalone HTML'}
              </span>
            </div>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9.5px] font-mono font-medium text-[#a8a29e] shrink-0">
              Inlined CSS (.html)
            </span>
          </button>
        </div>
      </div>

      {/* SECTION DIVIDER */}
      <div className="flex items-center gap-2 pt-1 px-1">
        <div className="h-px flex-1 bg-white/[0.08]"></div>
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-[#78716c]">
          Developer Exports & Tokens
        </span>
        <div className="h-px flex-1 bg-white/[0.08]"></div>
      </div>

      {/* FORMAT PILLS (Height 26px each) */}
      <div className="flex flex-wrap gap-1">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`flex h-[26px] items-center rounded-md px-2.5 text-[10.5px] font-medium transition duration-150 ${
              format === f.id
                ? 'bg-white text-[#141413] font-semibold shadow-xs'
                : 'bg-[#1c1b1a] text-[#a8a29e] hover:bg-[#242220] hover:text-[#faf9f5] border border-white/[0.06]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CODE VIEWER BOX */}
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141413] shadow-xs">
        {/* Code Bar Header (Height 32px) */}
        <div className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-[#1c1b1a] px-3">
          <span className="font-mono text-[10.5px] font-semibold text-[#faf9f5] truncate">
            {filename}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="flex h-5 items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 text-[9.5px] font-medium text-[#faf9f5] transition"
            >
              {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {format !== 'html' && (
              <button
                onClick={handleDownloadCodeFile}
                className="flex h-5 items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 text-[9.5px] font-medium text-[#faf9f5] transition"
              >
                <Download className="h-2.5 w-2.5" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <pre className="max-h-[220px] overflow-auto p-3 font-mono text-[10px] leading-relaxed text-[#a8a29e]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
