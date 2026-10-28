import React, { useState } from 'react';
import { Download, Copy, Check, Search, Archive, Image as ImageIcon } from 'lucide-react';
import type { ExtractedAsset, DesignTokens } from '../../types';
import { exportAssetsZip, triggerDownload } from '../../utils/zipExporter';

interface AssetGalleryProps {
  assets: ExtractedAsset[];
  tokens?: DesignTokens;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({ assets, tokens }) => {
  const [filter, setFilter] = useState<'all' | 'svg' | 'image' | 'background'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const filteredAssets = assets.filter((asset) => {
    if (filter !== 'all' && asset.type !== filter) return false;
    if (search && !asset.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCopySvg = (asset: ExtractedAsset) => {
    if (asset.content) {
      navigator.clipboard.writeText(asset.content);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleDownloadSingle = (asset: ExtractedAsset) => {
    if (asset.type === 'svg' && asset.content) {
      const blob = new Blob([asset.content], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(blob, `${asset.name || 'icon'}.svg`);
    } else {
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_URL',
        payload: {
          url: asset.url,
          filename: `${asset.name || 'asset'}.${asset.format || 'png'}`,
        },
      });
    }
  };

  const handleDownloadAllZip = async () => {
    if (isZipping || assets.length === 0) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zipBlob = await exportAssetsZip(assets, tokens, (percent) => {
        setZipProgress(percent);
      });
      const siteName = tokens?.domain.replace(/\./g, '_') || 'website';
      triggerDownload(zipBlob, `${siteName}-assets.zip`);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Top Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#78716c]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#1c1b1a] py-1.5 pl-8 pr-3 text-xs text-[#faf9f5] placeholder-[#78716c] outline-none transition focus:border-white/25"
          />
        </div>

        <button
          onClick={handleDownloadAllZip}
          disabled={isZipping || assets.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-2.5 py-1.5 text-[11px] font-semibold text-[#faf9f5] transition disabled:opacity-40 shrink-0"
        >
          <Archive className="h-3.5 w-3.5" />
          <span>{isZipping ? `${zipProgress}%` : 'ZIP All'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1">
        {(['all', 'svg', 'image', 'background'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition ${
              filter === type
                ? 'bg-white text-[#141413] font-semibold shadow-sm'
                : 'bg-[#1c1b1a] text-[#a8a29e] hover:bg-[#242220] hover:text-[#faf9f5] border border-white/[0.06]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#a8a29e]">
          No assets found matching your filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredAssets.map((asset) => {
            const isCopied = copiedId === asset.id;

            return (
              <div
                key={asset.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-2 transition hover:border-white/[0.16]"
              >
                {/* Preview Box */}
                <div className="bg-checkered flex h-24 w-full items-center justify-center rounded-lg border border-white/[0.04] p-2 overflow-hidden">
                  {asset.type === 'svg' && asset.content ? (
                    <div
                      className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full text-[#faf9f5]"
                      dangerouslySetInnerHTML={{ __html: asset.content }}
                    />
                  ) : (
                    <img
                      src={asset.previewUrl || asset.url}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Details Footer */}
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="truncate max-w-[90px] font-medium text-[#faf9f5]">
                    {asset.name}
                  </span>
                  <span className="font-mono text-[#78716c] uppercase text-[9px]">
                    {asset.format || asset.type}
                  </span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#141413]/85 opacity-0 backdrop-blur-xs transition group-hover:opacity-100">
                  {asset.type === 'svg' && asset.content && (
                    <button
                      onClick={() => handleCopySvg(asset)}
                      title="Copy SVG"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.1] text-[#faf9f5] hover:bg-white/[0.2] transition"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleDownloadSingle(asset)}
                    title="Download Asset"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.1] text-[#faf9f5] hover:bg-white/[0.2] transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
