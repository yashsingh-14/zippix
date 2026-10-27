import React, { useState } from 'react';
import { Crosshair, Sparkles, Copy, Check, Box, Palette, Download } from 'lucide-react';
import type { InspectedElement } from '../../types';
import { generateComponentHtml } from '../../utils/tokenGenerators';
import { triggerDownload } from '../../utils/zipExporter';

interface InspectorTabProps {
  element: InspectedElement | null;
  isInspecting: boolean;
  onStartInspect: () => void;
}

export const InspectorTab: React.FC<InspectorTabProps> = ({
  element,
  isInspecting,
  onStartInspect,
}) => {
  const [copiedType, setCopiedType] = useState<'prompt' | 'html' | 'tailwind' | null>(null);

  const copyToClipboard = (text: string, type: 'prompt' | 'html' | 'tailwind') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  if (!element) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-400">
          <Crosshair className="h-6 w-6 text-cyan-400" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-slate-200">No Element Inspected</h3>
        <p className="mt-1 max-w-[240px] text-xs text-slate-400">
          Click the button below and hover over any button, card, or element on the page.
        </p>
        <button
          onClick={onStartInspect}
          className="mt-4 flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400"
        >
          <Crosshair className="h-4 w-4" />
          <span>{isInspecting ? 'Inspecting...' : 'Start Inspector'}</span>
        </button>
      </div>
    );
  }

  const { boxModel, computedStyles } = element;

  return (
    <div className="space-y-4">
      {/* Target Selector Banner */}
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-cyan-300">
            &lt;{element.tagName.toLowerCase()}&gt;
          </span>
          <span className="text-[10px] text-slate-400">
            {boxModel.width} × {boxModel.height}px
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-400">
          {element.selectorPath}
        </p>
      </div>

      {/* Primary Action: Copy AI Prompt */}
      <button
        onClick={() => copyToClipboard(element.aiPrompt, 'prompt')}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 p-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-95"
      >
        {copiedType === 'prompt' ? (
          <>
            <Check className="h-4 w-4 text-emerald-300" />
            <span>AI Prompt Copied!</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Copy AI Prompt (Claude / ChatGPT / Cursor)</span>
          </>
        )}
      </button>

      {/* Box Model Visualizer */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Box className="h-3.5 w-3.5 text-indigo-400" />
          <span>Box Model</span>
        </div>

        {/* Nested Box Model */}
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-2 text-center text-[10px] text-amber-400 font-mono">
          <div className="text-[9px] uppercase tracking-wider text-amber-500/70 font-semibold">Margin ({boxModel.margin.top} {boxModel.margin.right} {boxModel.margin.bottom} {boxModel.margin.left})</div>
          
          <div className="my-1.5 rounded border border-emerald-500/30 bg-emerald-500/5 p-2 text-emerald-400">
            <div className="text-[9px] uppercase tracking-wider text-emerald-500/70 font-semibold">Padding ({boxModel.padding.top} {boxModel.padding.right} {boxModel.padding.bottom} {boxModel.padding.left})</div>
            
            <div className="my-1.5 rounded border border-cyan-500/50 bg-cyan-500/10 py-1.5 text-cyan-300 font-bold">
              {boxModel.width} × {boxModel.height}
            </div>
          </div>
        </div>
      </div>

      {/* Key Styles */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Palette className="h-3.5 w-3.5 text-cyan-400" />
          <span>Computed Styles</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] uppercase">Color</span>
            <span className="font-mono text-slate-200 truncate block">{computedStyles.color}</span>
          </div>

          <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] uppercase">Background</span>
            <span className="font-mono text-slate-200 truncate block">{computedStyles.backgroundColor}</span>
          </div>

          <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] uppercase">Typography</span>
            <span className="font-mono text-slate-200 truncate block">
              {computedStyles.fontSize} ({computedStyles.fontWeight})
            </span>
          </div>

          <div className="rounded bg-slate-950/60 p-2 border border-slate-800/60">
            <span className="text-slate-500 block text-[9px] uppercase">Radius</span>
            <span className="font-mono text-slate-200 truncate block">{computedStyles.borderRadius}</span>
          </div>
        </div>
      </div>

      {/* Tailwind Guess */}
      {element.tailwindGuess && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Tailwind Equivalent</span>
            <button
              onClick={() => copyToClipboard(element.tailwindGuess, 'tailwind')}
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {copiedType === 'tailwind' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedType === 'tailwind' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="rounded bg-slate-950 p-2 font-mono text-[11px] text-cyan-300/90 break-words border border-slate-800">
            {element.tailwindGuess}
          </p>
        </div>
      )}

      {/* Raw HTML */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">HTML & Live Preview</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => copyToClipboard(element.cleanHtml, 'html')}
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium bg-slate-800 px-2 py-1 rounded transition"
            >
              {copiedType === 'html' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              <span>{copiedType === 'html' ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={() => {
                const html = element.cloneHtml || generateComponentHtml(element);
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                triggerDownload(blob, `${element.tagName.toLowerCase()}-preview.html`);
              }}
              title="Download standalone HTML file that opens live in Chrome"
              className="flex items-center gap-1 text-[10px] text-slate-200 hover:text-white font-medium bg-cyan-600/80 hover:bg-cyan-600 px-2 py-1 rounded transition"
            >
              <Download className="h-3 w-3" />
              <span>Download .html</span>
            </button>
          </div>
        </div>
        <pre className="max-h-36 overflow-auto rounded bg-slate-950 p-2 font-mono text-[10px] text-slate-300 border border-slate-800">
          {element.cleanHtml}
        </pre>
      </div>
    </div>
  );
};
