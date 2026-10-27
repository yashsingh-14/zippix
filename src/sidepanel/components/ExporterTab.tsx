import React, { useState } from 'react';
import { Copy, Check, Download, Code2, Sparkles } from 'lucide-react';
import type { DesignTokens } from '../../types';
import {
  generateStandaloneHtml,
  generateComponentHtml,
  generateTailwindV3,
  generateTailwindV4,
  generateCssVariables,
  generateDesignTokensJson,
} from '../../utils/tokenGenerators';
import { triggerDownload } from '../../utils/zipExporter';
import type { InspectedElement } from '../../types';

interface ExporterTabProps {
  tokens: DesignTokens;
  element?: InspectedElement | null;
}

export const ExporterTab: React.FC<ExporterTabProps> = ({ tokens, element }) => {
  const [format, setFormat] = useState<'html' | 'component' | 'tailwind4' | 'tailwind3' | 'css' | 'tokens_doc'>('html');
  const [copied, setCopied] = useState(false);

  const getExportCode = () => {
    switch (format) {
      case 'html':
        return {
          code: tokens.fullPageHtml || generateStandaloneHtml(tokens, element),
          filename: 'index.html',
          mime: 'text/html',
        };
      case 'component':
        return {
          code: element?.cloneHtml || (element ? generateComponentHtml(element, tokens) : '<!-- Please inspect an element first -->'),
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
          filename: 'design-system-overview.html',
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
              className="flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
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
