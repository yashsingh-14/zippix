import React, { useState } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import type { ExtractedColor } from '../../types';

interface ColorVaultProps {
  colors: ExtractedColor[];
}

export const ColorVault: React.FC<ColorVaultProps> = ({ colors }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const filteredColors = colors.filter((c) => {
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  const categories = ['all', 'primary', 'background', 'text', 'accent', 'neutral'];

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
              selectedCategory === cat
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Colors Grid */}
      {filteredColors.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No colors found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredColors.map((color) => {
            const isCopied = copiedHex === color.hex;

            return (
              <div
                key={color.hex}
                onClick={() => handleCopy(color.hex)}
                className="group relative flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                {/* Swatch */}
                <div
                  className="h-9 w-9 shrink-0 rounded-md border border-white/10 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {color.hex}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ×{color.count}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[10px] capitalize text-slate-400">
                      {color.category}
                    </span>
                    {color.isAccessibleOnDark && (
                      <span
                        title={`Contrast vs dark: ${color.contrastOnDark}:1 (WCAG AA)`}
                        className="flex items-center gap-0.5 text-[9px] text-emerald-400 font-medium"
                      >
                        <ShieldCheck className="h-2.5 w-2.5" />
                        AA
                      </span>
                    )}
                  </div>
                </div>

                {/* Copy Indicator */}
                <div className="absolute top-2 right-2 opacity-0 transition group-hover:opacity-100">
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
