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
    <div className="space-y-3.5">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition ${
              selectedCategory === cat
                ? 'bg-white text-[#141413] font-semibold shadow-sm'
                : 'bg-[#1c1b1a] text-[#a8a29e] hover:bg-[#242220] hover:text-[#faf9f5] border border-white/[0.06]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Colors Grid */}
      {filteredColors.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#a8a29e]">
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
                className="group relative flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#1c1b1a] p-2.5 transition hover:border-white/[0.14] hover:bg-[#242220]"
              >
                {/* Color Swatch */}
                <div
                  className="h-8 w-8 shrink-0 rounded-md border border-white/[0.1] shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#faf9f5]">
                      {color.hex.toUpperCase()}
                    </span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-[#a8a29e] opacity-0 transition group-hover:opacity-100" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9.5px] text-[#a8a29e]">
                    <span className="capitalize">{color.category}</span>
                    {color.isAccessibleOnDark && (
                      <span title="WCAG AA on dark">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
