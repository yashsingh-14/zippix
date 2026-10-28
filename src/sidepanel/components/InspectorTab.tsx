import React, { useState } from 'react';
import { Crosshair, Sparkles, Copy, Check, Box, Palette, Download } from 'lucide-react';
import type { InspectedElement } from '../../types';
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#1c1b1a] text-[#a8a29e]">
          <Crosshair className="h-5 w-5 text-[#faf9f5]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#faf9f5]">No Element Selected</h3>
        <p className="mt-1 max-w-[240px] text-xs text-[#a8a29e]">
          Click below to hover and inspect any button, card, or navigation bar on the page.
        </p>
        <button
          onClick={onStartInspect}
          className="mt-4 flex items-center gap-2 rounded-lg bg-white text-[#141413] px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/90"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span>{isInspecting ? 'Inspecting...' : 'Start Inspector'}</span>
        </button>
      </div>
    );
  }

  const { boxModel, computedStyles } = element;

  return (
    <div className="space-y-3.5">
      {/* Target Selector Banner */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-[#faf9f5]">
            &lt;{element.tagName.toLowerCase()}&gt;
          </span>
          <span className="font-mono text-[10px] text-[#78716c]">
            {boxModel.width} × {boxModel.height}px
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#a8a29e] truncate">
          {element.selectorPath}
        </p>
      </div>

      {/* AI Prompt Generator Card */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#faf9f5]">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>AI Component Prompt</span>
          </div>
          <button
            onClick={() => copyToClipboard(element.aiPrompt, 'prompt')}
            className="flex items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 py-1 text-[10px] font-medium text-[#faf9f5] transition"
          >
            {copiedType === 'prompt' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedType === 'prompt' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <p className="mt-1 text-[10px] text-[#a8a29e]">
          Paste this prompt into Cursor, Claude, or ChatGPT to reproduce this element.
        </p>
      </div>

      {/* Tailwind Guess */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#faf9f5]">Tailwind CSS Classes</span>
          <button
            onClick={() => copyToClipboard(element.tailwindGuess, 'tailwind')}
            className="flex items-center gap-1 rounded bg-white/[0.08] hover:bg-white/[0.14] px-2 py-1 text-[10px] font-medium text-[#faf9f5] transition"
          >
            {copiedType === 'tailwind' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copiedType === 'tailwind' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <div className="mt-2 rounded-lg bg-[#141413] p-2.5 font-mono text-[10.5px] leading-relaxed text-[#a8a29e]">
          {element.tailwindGuess || '/* No standard tailwind match */'}
        </div>
      </div>

      {/* Computed Styles Grid */}
      <div className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#faf9f5] mb-2.5">
          <Palette className="h-3.5 w-3.5" />
          <span>Computed CSS Properties</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[10.5px]">
          <div>
            <span className="text-[#78716c]">color:</span>
            <span className="ml-1.5 text-[#faf9f5] truncate">{computedStyles.color}</span>
          </div>
          <div>
            <span className="text-[#78716c]">bg:</span>
            <span className="ml-1.5 text-[#faf9f5] truncate">{computedStyles.backgroundColor}</span>
          </div>
          <div>
            <span className="text-[#78716c]">font:</span>
            <span className="ml-1.5 text-[#faf9f5] truncate">{computedStyles.fontFamily}</span>
          </div>
          <div>
            <span className="text-[#78716c]">size:</span>
            <span className="ml-1.5 text-[#faf9f5]">{computedStyles.fontSize}</span>
          </div>
          <div>
            <span className="text-[#78716c]">radius:</span>
            <span className="ml-1.5 text-[#faf9f5]">{computedStyles.borderRadius}</span>
          </div>
          <div>
            <span className="text-[#78716c]">display:</span>
            <span className="ml-1.5 text-[#faf9f5]">{computedStyles.display}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
