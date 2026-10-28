import React, { useState } from 'react';
import { Type } from 'lucide-react';
import type { ExtractedFont } from '../../types';

interface TypographyVaultProps {
  fonts: ExtractedFont[];
}

export const TypographyVault: React.FC<TypographyVaultProps> = ({ fonts }) => {
  const [sampleText, setSampleText] = useState<string>('The quick brown fox jumps over the lazy dog');

  return (
    <div className="space-y-3.5">
      {/* Sample Text Input */}
      <div>
        <label className="mb-1 block text-[10.5px] font-medium text-[#a8a29e]">
          Preview Text
        </label>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          placeholder="Type something to preview..."
          className="w-full rounded-lg border border-white/[0.08] bg-[#1c1b1a] px-3 py-1.5 text-xs text-[#faf9f5] outline-none transition focus:border-white/25"
        />
      </div>

      {/* Font Cards */}
      {fonts.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#a8a29e]">
          No custom fonts detected on this page.
        </div>
      ) : (
        <div className="space-y-2.5">
          {fonts.map((font) => (
            <div
              key={font.family}
              className="rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-3 transition hover:border-white/[0.14]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-[#faf9f5]" />
                  <span className="text-[12px] font-semibold text-[#faf9f5]">{font.family}</span>
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-[#a8a29e] uppercase">
                    {font.source}
                  </span>
                </div>
                <span className="text-[10px] text-[#78716c]">
                  {font.usageCount} uses
                </span>
              </div>

              {/* Live Preview */}
              <div className="py-2.5">
                <p
                  style={{ fontFamily: font.family }}
                  className="truncate text-base text-[#faf9f5]"
                >
                  {sampleText || font.family}
                </p>
              </div>

              {/* Weights & Sizes Badges */}
              <div className="flex flex-wrap items-center gap-1 border-t border-white/[0.06] pt-2 text-[10px] text-[#a8a29e]">
                <span className="text-[#78716c]">Weights:</span>
                {font.weights.slice(0, 5).map((w) => (
                  <span key={w} className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] text-[#faf9f5]">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
