import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Archive, FileCode2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import type { DesignTokens, InspectedElement } from '../../types';
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

interface ExporterTabProps {
  tokens: DesignTokens;
  element?: InspectedElement | null;
}

export const ExporterTab: React.FC<ExporterTabProps> = ({ tokens, element }) => {
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

  // 1-Click ZIP Package Download (Woblo format)
  const handleDownloadZipPackage = async () => {
    setIsZipping(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_PAGE_ZIP' }, async (response) => {
          if (chrome.runtime.lastError || response?.status !== 'ok') {
            // Fallback export
            const fullHtml = liveCloneHtml || tokens.fullPageHtml || '';
            const zipBlob = await exportCloneZip(fullHtml, tokens.domain || 'page-clone');
            const safeDomain = (tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-');
            triggerDownload(zipBlob, `${safeDomain}.full-page.Zippix.zip`);
          }
          setIsZipping(false);
          showSuccessNotice('ZIP package downloaded successfully!');
        });
      } else {
        const fullHtml = liveCloneHtml || tokens.fullPageHtml || '';
        const zipBlob = await exportCloneZip(fullHtml, tokens.domain || 'page-clone');
        const safeDomain = (tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-');
        triggerDownload(zipBlob, `${safeDomain}.full-page.Zippix.zip`);
        setIsZipping(false);
        showSuccessNotice('ZIP package downloaded successfully!');
      }
    } catch (e) {
      console.error('Failed to create clone zip:', e);
      setIsZipping(false);
    }
  };

  // 1-Click Standalone HTML Download (Inlined CSS & base64 images)
  const handleDownloadStandaloneHtml = async () => {
    setIsDownloadingHtml(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_PAGE_HTML' }, (response) => {
          if (chrome.runtime.lastError || response?.status !== 'ok') {
            const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
            triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
          }
          setIsDownloadingHtml(false);
          showSuccessNotice('Standalone HTML downloaded!');
        });
      } else {
        const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
        triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
        setIsDownloadingHtml(false);
        showSuccessNotice('Standalone HTML downloaded!');
      }
    } catch {
      const blob = new Blob([liveCloneHtml || tokens.fullPageHtml || code], { type: 'text/html;charset=utf-8' });
      triggerDownload(blob, `${(tokens.domain || 'website').replace(/[^a-z0-9_-]/gi, '-')}.html`);
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
    <div className="space-y-4 pb-6">
      {/* Success Notification Banner */}
      {downloadSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* HERO SECTION: 1-Click 1:1 Page Clone Box (Woblo Equivalent) */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-[13px] font-semibold tracking-tight text-[#faf9f5]">1:1 Full Page Clone</span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#a8a29e]">
            {isCloning ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-amber-400" />
                <span>Capturing...</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Ready</span>
              </>
            )}
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-[#a8a29e]">
          Clones the active page with consolidated CSS, inlined base64 images, centered videos, and interactive hamburger animations.
        </p>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {/* ZIP Package Button (Exact Woblo Equivalent) */}
          <button
            onClick={handleDownloadZipPackage}
            disabled={isZipping || isCloning}
            className="group relative flex items-center justify-between rounded-lg bg-[#242220] hover:bg-[#2c2a28] border border-white/[0.1] px-3.5 py-2.5 transition-all text-start disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] text-[#faf9f5]">
                {isZipping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#faf9f5]">
                  {isZipping ? 'Creating ZIP Package...' : 'Download ZIP Package'}
                </div>
                <div className="text-[10px] text-[#a8a29e] truncate">
                  index.html + styles.css (Woblo format)
                </div>
              </div>
            </div>
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-[#faf9f5] shrink-0">
              ZIP
            </span>
          </button>

          {/* Standalone HTML Button */}
          <button
            onClick={handleDownloadStandaloneHtml}
            disabled={isDownloadingHtml || isCloning}
            className="group relative flex items-center justify-between rounded-lg bg-[#242220] hover:bg-[#2c2a28] border border-white/[0.1] px-3.5 py-2.5 transition-all text-start disabled:opacity-50"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.08] text-[#faf9f5]">
                {isDownloadingHtml ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileCode2 className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#faf9f5]">
                  {isDownloadingHtml ? 'Packaging HTML...' : 'Download Standalone HTML'}
                </div>
                <div className="text-[10px] text-[#a8a29e] truncate">
                  Single file with inlined CSS (Double-click to open)
                </div>
              </div>
            </div>
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-[#faf9f5] shrink-0">
              HTML
            </span>
          </button>
        </div>
      </div>

      {/* SECTION DIVIDER */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-white/[0.08]"></div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#78716c]">
          Code & Token Exports
        </span>
        <div className="h-px flex-1 bg-white/[0.08]"></div>
      </div>

      {/* FORMAT SELECTOR PILLS */}
      <div className="flex flex-wrap gap-1">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
              format === f.id
                ? 'bg-white text-[#141413] font-semibold shadow-sm'
                : 'bg-[#1c1b1a] text-[#a8a29e] hover:bg-[#242220] hover:text-[#faf9f5] border border-white/[0.06]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CODE VIEWER BOX */}
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#141413]">
        {/* Code Bar Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#1c1b1a] px-3 py-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] font-medium text-[#faf9f5] truncate">{filename}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 py-1 text-[10px] font-medium text-[#faf9f5] transition"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {format !== 'html' && (
              <button
                onClick={handleDownloadCodeFile}
                className="flex items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 py-1 text-[10px] font-medium text-[#faf9f5] transition"
              >
                <Download className="h-3 w-3" />
                <span>Save</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <pre className="max-h-[260px] overflow-auto p-3 font-mono text-[10.5px] leading-relaxed text-[#a8a29e]">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
