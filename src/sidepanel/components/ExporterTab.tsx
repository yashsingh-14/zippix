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

              // 1. Snapshot any 3D/2D Canvas elements (Three.js / WebGL / Spline)
              const canvasMap = new Map<number, string>();
              document.querySelectorAll('canvas').forEach((cv, idx) => {
                try {
                  const dUrl = cv.toDataURL('image/png');
                  if (dUrl && dUrl.length > 100) canvasMap.set(idx, dUrl);
                } catch (e) {
                  try {
                    const off = document.createElement('canvas');
                    off.width = cv.width || cv.clientWidth || 300;
                    off.height = cv.height || cv.clientHeight || 150;
                    const ctx = off.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(cv, 0, 0);
                      canvasMap.set(idx, off.toDataURL('image/png'));
                    }
                  } catch (err2) {}
                }
              });

              // 2. Clone document
              const docClone = document.documentElement.cloneNode(true) as HTMLElement;
              docClone.querySelector('#zippix-inspector-root')?.remove();
              docClone.querySelectorAll('script').forEach((s) => s.remove());

              let head = docClone.querySelector('head');
              if (!head) {
                head = document.createElement('head');
                docClone.insertBefore(head, docClone.firstChild);
              }

              // Prepend <base href="...">
              head.querySelectorAll('base').forEach((b) => b.remove());
              const baseTag = document.createElement('base');
              baseTag.setAttribute('href', currentUrl);
              head.insertBefore(baseTag, head.firstChild);

              // 3. Replace <canvas> with snapshot images
              docClone.querySelectorAll('canvas').forEach((cv, idx) => {
                const dataUrl = canvasMap.get(idx);
                if (dataUrl) {
                  const img = document.createElement('img');
                  img.src = dataUrl;
                  img.setAttribute('style', cv.getAttribute('style') || '');
                  img.className = cv.className;
                  cv.replaceWith(img);
                }
              });

              // 4. Fix <video> tags
              const liveVideos = document.querySelectorAll('video');
              docClone.querySelectorAll('video').forEach((clonedV, idx) => {
                const liveV = liveVideos[idx];
                const vSrc = (liveV && (liveV.currentSrc || liveV.src)) || clonedV.currentSrc || clonedV.src;
                if (vSrc) {
                  try { clonedV.src = new URL(vSrc, currentUrl).href; } catch { clonedV.src = vSrc; }
                }
                clonedV.setAttribute('autoplay', '');
                clonedV.setAttribute('loop', '');
                clonedV.setAttribute('muted', '');
                clonedV.setAttribute('playsinline', '');
              });

              // 5. Fix <img> and <picture> sources
              const liveImgs = document.querySelectorAll('img');
              docClone.querySelectorAll('img').forEach((img, idx) => {
                const liveImg = liveImgs[idx];
                const iSrc = (liveImg && (liveImg.currentSrc || liveImg.src)) || img.getAttribute('src');
                if (iSrc) {
                  try { img.src = new URL(iSrc, currentUrl).href; } catch { img.src = iSrc; }
                }
                img.setAttribute('loading', 'eager');
                img.removeAttribute('decoding');
                const ss = img.getAttribute('srcset');
                if (ss) {
                  try {
                    img.setAttribute('srcset', ss.split(',').map((p) => {
                      const [u, sz] = p.trim().split(/\s+/);
                      if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
                        return `${new URL(u, currentUrl).href} ${sz || ''}`.trim();
                      }
                      return p.trim();
                    }).join(', '));
                  } catch (e) {}
                }
              });

              // Fix <source> tags
              docClone.querySelectorAll('source').forEach((source) => {
                const sSrc = source.getAttribute('src');
                if (sSrc && !sSrc.startsWith('http') && !sSrc.startsWith('//') && !sSrc.startsWith('data:')) {
                  try { source.setAttribute('src', new URL(sSrc, currentUrl).href); } catch {}
                }
                const sSet = source.getAttribute('srcset');
                if (sSet) {
                  try {
                    source.setAttribute('srcset', sSet.split(',').map((p) => {
                      const [u, sz] = p.trim().split(/\s+/);
                      if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
                        return `${new URL(u, currentUrl).href} ${sz || ''}`.trim();
                      }
                      return p.trim();
                    }).join(', '));
                  } catch (e) {}
                }
              });

              // 6. Sync computed styles, background-images & 3D transforms for elements
              const liveElements = document.querySelectorAll('*');
              const clonedElements = docClone.querySelectorAll('*');
              const total = Math.min(liveElements.length, clonedElements.length);
              for (let i = 0; i < total; i++) {
                const live = liveElements[i] as HTMLElement;
                const cloned = clonedElements[i] as HTMLElement;
                if (live && cloned && live.nodeType === 1) {
                  try {
                    const comp = window.getComputedStyle(live);
                    if (comp.backgroundImage && comp.backgroundImage !== 'none' && comp.backgroundImage.includes('url(')) {
                      cloned.style.backgroundImage = comp.backgroundImage.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, q, r) => {
                        if (r.startsWith('data:') || r.startsWith('http')) return m;
                        try { return `url("${new URL(r, currentUrl).href}")`; } catch { return m; }
                      });
                      cloned.style.backgroundSize = comp.backgroundSize;
                      cloned.style.backgroundPosition = comp.backgroundPosition;
                      cloned.style.backgroundRepeat = comp.backgroundRepeat;
                    }
                    if (comp.transform && comp.transform !== 'none' && !cloned.style.transform) {
                      cloned.style.transform = comp.transform;
                      cloned.style.transformOrigin = comp.transformOrigin;
                    }
                    const op = parseFloat(comp.opacity);
                    if (op > 0.05 && comp.display !== 'none' && comp.visibility !== 'hidden') {
                      if (cloned.style.opacity === '0') cloned.style.opacity = '1';
                      if (cloned.style.visibility === 'hidden') cloned.style.visibility = 'visible';
                    }
                  } catch (e) {}
                }
              }

              // 7. Inline stylesheets with rewritten absolute URLs
              let inlinedStyles = '';
              for (const sheet of Array.from(document.styleSheets)) {
                try {
                  const rules = sheet.cssRules || sheet.rules;
                  if (rules) {
                    for (const rule of Array.from(rules)) {
                      inlinedStyles += rule.cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, q, r) => {
                        if (r.startsWith('data:') || r.startsWith('http')) return m;
                        try { return `url("${new URL(r, sheet.href || currentUrl).href}")`; } catch { return m; }
                      }) + '\n';
                    }
                  }
                } catch (e) {}
              }

              docClone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
                  try { link.setAttribute('href', new URL(href, currentUrl).href); } catch {}
                }
              });

              if (inlinedStyles) {
                const styleEl = document.createElement('style');
                styleEl.setAttribute('data-zippix', 'master-cloned-styles');
                styleEl.textContent = inlinedStyles;
                head.appendChild(styleEl);
              }

              const helperStyle = document.createElement('style');
              helperStyle.textContent = `
                *, *::before, *::after {
                  animation-play-state: running !important;
                }
                video {
                  pointer-events: auto !important;
                }
              `;
              head.appendChild(helperStyle);

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
