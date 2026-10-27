import React, { useState } from 'react';
import { Download, Copy, Check, Search, FileArchive, Image as ImageIcon } from 'lucide-react';
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

  const svgCount = assets.filter((a) => a.type === 'svg').length;
  const imgCount = assets.filter((a) => a.type !== 'svg').length;

  return (
    <div className="space-y-4">
      {/* Top Controls: Search & ZIP Download */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none transition focus:border-cyan-500/50"
          />
        </div>

        <button
          onClick={handleDownloadAllZip}
          disabled={isZipping || assets.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-50"
        >
          <FileArchive className="h-3.5 w-3.5" />
          <span>{isZipping ? `${zipProgress}%` : 'ZIP All'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex gap-1.5">
          {(['all', 'svg', 'image', 'background'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium capitalize transition ${
                filter === type
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'all' ? `All (${assets.length})` : type === 'svg' ? `SVGs (${svgCount})` : type === 'image' ? `Images (${imgCount})` : 'Backgrounds'}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No assets match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredAssets.map((asset) => {
            const isCopied = copiedId === asset.id;

            return (
              <div
                key={asset.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-slate-800/80 bg-slate-900/40 transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                {/* Visual Preview Box */}
                <div className="bg-checkered flex h-24 w-full items-center justify-center p-3 relative overflow-hidden">
                  {asset.type === 'svg' ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <img
                      src={asset.previewUrl}
                      alt={asset.name}
                      loading="lazy"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}

                  {/* Dimension pill */}
                  {asset.width && asset.height && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.2 text-[9px] font-mono text-slate-300">
                      {asset.width}×{asset.height}
                    </span>
                  )}
                </div>

                {/* Footer details & quick actions */}
                <div className="p-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="truncate text-[11px] font-medium text-slate-300 max-w-[90px]" title={asset.name}>
                    {asset.name}
                  </span>

                  <div className="flex items-center gap-1">
                    {asset.type === 'svg' && (
                      <button
                        onClick={() => handleCopySvg(asset)}
                        title="Copy raw SVG code"
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
                      >
                        {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadSingle(asset)}
                      title="Download file"
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-400 transition"
                    >
                      <Download className="h-3 w-3" />
                    </button>
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
