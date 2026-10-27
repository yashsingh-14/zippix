import React, { useState, useEffect } from 'react';
import { Copy, Check, Download, Code2 } from 'lucide-react';
import type { DesignTokens, InspectedElement } from '../../types';
import {
  generateStandaloneHtml,
  generateComponentHtml,
  generateTailwindV3,
  generateTailwindV4,
  generateCssVariables,
  generateDesignTokensJson,
} from '../../utils/tokenGenerators';
import { triggerDownload } from '../../utils/zipExporter';

interface ExporterTabProps {
  tokens: DesignTokens;
  element?: InspectedElement | null;
}

export const ExporterTab: React.FC<ExporterTabProps> = ({ tokens, element }) => {
  const [format, setFormat] = useState<'html' | 'component' | 'tailwind4' | 'tailwind3' | 'css' | 'tokens_doc'>('html');
  const [copied, setCopied] = useState(false);
  const [liveCloneHtml, setLiveCloneHtml] = useState<string>('');
  const [isCloning, setIsCloning] = useState(false);

  // Directly clone the active tab DOM in real-time
  useEffect(() => {
    setIsCloning(true);
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id },
            func: () => {
              const currentUrl = window.location.href;
              const docClone = document.documentElement.cloneNode(true) as HTMLElement;

              // Remove Zippix inspector elements
              docClone.querySelector('#zippix-inspector-root')?.remove();
              docClone.querySelectorAll('script').forEach((s) => s.remove());

              let head = docClone.querySelector('head');
              if (!head) {
                head = document.createElement('head');
                docClone.insertBefore(head, docClone.firstChild);
              }

              // Put <base href="..."> at the very top of <head> so all images/fonts load
              head.querySelectorAll('base').forEach((b) => b.remove());
              const baseTag = document.createElement('base');
              baseTag.setAttribute('href', currentUrl);
              head.insertBefore(baseTag, head.firstChild);

              // Gather all stylesheets
              let inlinedStyles = '';
              for (const sheet of Array.from(document.styleSheets)) {
                try {
                  const rules = sheet.cssRules || sheet.rules;
                  if (rules) {
                    for (const rule of Array.from(rules)) {
                      inlinedStyles += rule.cssText + '\n';
                    }
                  }
                } catch (e) {}
              }

              if (inlinedStyles) {
                const styleEl = document.createElement('style');
                styleEl.setAttribute('data-zippix', 'cloned-styles');
                styleEl.textContent = inlinedStyles;
                head.appendChild(styleEl);
              }

              return '<!DOCTYPE html>\n' + docClone.outerHTML;
            },
          })
          .then(([res]) => {
            if (res && res.result) {
              setLiveCloneHtml(res.result);
            }
            setIsCloning(false);
          })
          .catch((err) => {
            console.warn('Live clone failed:', err);
            setIsCloning(false);
          });
      } else {
        setIsCloning(false);
      }
    });
  }, []);

  const getExportCode = () => {
    switch (format) {
      case 'html':
        return {
          code: liveCloneHtml || tokens.fullPageHtml || '<!DOCTYPE html>\n<html><body>Loading 1:1 page clone...</body></html>',
          filename: 'index.html',
          mime: 'text/html',
        };
      case 'component':
        return {
          code: element?.cloneHtml || (element ? generateComponentHtml(element, tokens) : '<!-- Inspect an element first -->'),
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

  const handleDownload = () => {
    const blob = new Blob([code], { type: `${mime};charset=utf-8` });
    triggerDownload(blob, filename);
  };

  const formats = [
    { id: 'html', label: '1:1 Page Clone (index.html)' },
    ...(element ? [{ id: 'component' as const, label: `Inspected <${element.tagName.toLowerCase()}>.html` }] : []),
    { id: 'tailwind4', label: 'Tailwind v4 (@theme)' },
    { id: 'tailwind3', label: 'Tailwind v3' },
    { id: 'css', label: 'CSS Variables' },
    { id: 'tokens_doc', label: 'Design Tokens Doc' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Format Selector Pills */}
      <div className="flex flex-wrap gap-1.5">
        {formats.map((f) => (
          <button
            key={f.id}
            onClick={() => setFormat(f.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              format === f.id
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Code Viewer Container */}
      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {/* Code Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-3 py-2">
          <div className="flex items-center gap-2">
            <Code2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-xs font-medium text-slate-300">{filename}</span>
            {format === 'html' && (
              <span className="text-[10px] text-cyan-400/90 font-sans">
                {isCloning ? '(Capturing 1:1 clone...)' : '(Exact Live Website Replica)'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded bg-cyan-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-cyan-500 shadow-sm transition"
            >
              <Download className="h-3 w-3" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="max-h-[380px] overflow-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
