import React, { useState } from 'react';
import { Type, ExternalLink } from 'lucide-react';
import type { ExtractedFont } from '../../types';

interface TypographyVaultProps {
  fonts: ExtractedFont[];
}

export const TypographyVault: React.FC<TypographyVaultProps> = ({ fonts }) => {
  const [sampleText, setSampleText] = useState<string>('The quick brown fox jumps over the lazy dog');

  return (
    <div className="space-y-4">
      {/* Sample Text Input */}
      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-slate-400">
          Preview Text
        </label>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          placeholder="Type something to preview..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 outline-none transition focus:border-cyan-500/50"
        />
      </div>

      {/* Font Cards */}
      {fonts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No custom fonts detected on this page.
        </div>
      ) : (
        <div className="space-y-3">
          {fonts.map((font) => (
            <div
              key={font.family}
              className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 transition hover:border-slate-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">{font.family}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 uppercase">
                    {font.source}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">
                  Used in {font.usageCount} elements
                </span>
              </div>

              {/* Live Preview */}
              <div className="py-3">
                <p
                  style={{ fontFamily: font.family }}
                  className="truncate text-base text-slate-100 transition"
                >
                  {sampleText || font.family}
                </p>
              </div>

              {/* Weights and Sizes */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                <span className="text-slate-500 font-medium">Weights:</span>
                {font.weights.map((w) => (
                  <span
                    key={w}
                    className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-slate-300"
                  >
                    {w}
                  </span>
                ))}
              </div>

              {font.sizes.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500 font-medium">Sizes:</span>
                  {font.sizes.slice(0, 6).map((s) => (
                    <span
                      key={s}
                      className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-cyan-300/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
