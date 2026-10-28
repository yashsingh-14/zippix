import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Search,
  Archive,
  Play,
  Volume2,
  FileCode,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import type { ExtractedAsset, DesignTokens } from '../../types';
import { exportAssetsZip, triggerDownload } from '../../utils/zipExporter';

interface AssetGalleryProps {
  assets: ExtractedAsset[];
  tokens?: DesignTokens;
}

type FilterType = 'all' | 'video' | 'image' | 'svg' | 'background' | 'lottie' | 'audio' | string;

const CORE_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
  { id: 'svg', label: 'SVG' },
  { id: 'background', label: 'Background' },
  { id: 'lottie', label: 'Lottie' },
  { id: 'audio', label: 'Audio' },
];

export const AssetGallery: React.FC<AssetGalleryProps> = ({ assets, tokens }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  // Compute category list dynamically including any custom asset types
  const allDetectedTypes = Array.from(new Set(assets.map((a) => a.type)));
  const extraCategories = allDetectedTypes
    .filter((type) => !CORE_CATEGORIES.some((c) => c.id === type))
    .map((type) => ({ id: type, label: type.charAt(0).toUpperCase() + type.slice(1) }));

  const categories = [...CORE_CATEGORIES, ...extraCategories];

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return assets.length;
    return assets.filter((a) => a.type === categoryId).length;
  };

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

  const handleCopyUrl = (asset: ExtractedAsset) => {
    if (asset.url) {
      navigator.clipboard.writeText(asset.url);
      setCopiedUrlId(asset.id);
      setTimeout(() => setCopiedUrlId(null), 1500);
    }
  };

  const handleDownloadSingle = (asset: ExtractedAsset) => {
    if (asset.type === 'svg' && asset.content) {
      const blob = new Blob([asset.content], { type: 'image/svg+xml;charset=utf-8' });
      triggerDownload(blob, `${asset.name || 'icon'}.svg`);
    } else if (asset.type === 'lottie' && asset.content) {
      const blob = new Blob([asset.content], { type: 'application/json' });
      triggerDownload(blob, `${asset.name || 'animation'}.json`);
    } else {
      const ext = asset.format || (asset.type === 'video' ? 'mp4' : asset.type === 'audio' ? 'mp3' : 'png');
      const baseName = asset.name || asset.type;
      const cleanFilename = baseName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
        ? baseName
        : `${baseName}.${ext}`;

      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_URL',
        payload: {
          url: asset.url,
          filename: cleanFilename,
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
      {/* Top Search & Download Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#78716c]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search all assets..."
            className="w-full rounded-lg border border-white/[0.08] bg-[#1c1b1a] py-1.5 pl-8 pr-3 text-xs text-[#faf9f5] placeholder-[#78716c] outline-none transition focus:border-white/25"
          />
        </div>

        <button
          onClick={handleDownloadAllZip}
          disabled={isZipping || assets.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] px-2.5 py-1.5 text-[11px] font-semibold text-[#faf9f5] transition disabled:opacity-40 shrink-0 shadow-xs"
        >
          <Archive className="h-3.5 w-3.5" />
          <span>{isZipping ? `${zipProgress}%` : 'ZIP All'}</span>
        </button>
      </div>

      {/* Multi-Category Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const count = getCategoryCount(cat.id);
          const isActive = filter === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition shrink-0 ${
                isActive
                  ? 'bg-white text-[#141413] font-semibold shadow-xs'
                  : 'bg-[#1c1b1a] text-[#a8a29e] hover:bg-[#242220] hover:text-[#faf9f5] border border-white/[0.06]'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono leading-tight ${
                  isActive ? 'bg-[#141413]/15 text-[#141413]' : 'bg-white/[0.08] text-[#78716c]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#a8a29e] rounded-xl border border-dashed border-white/[0.08] bg-[#1c1b1a]/50">
          No assets found in category <span className="font-semibold text-white">"{filter}"</span>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredAssets.map((asset) => {
            const isCopiedSvg = copiedId === asset.id;
            const isCopiedUrl = copiedUrlId === asset.id;

            return (
              <div
                key={asset.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-[#1c1b1a] p-2 transition hover:border-white/[0.18]"
              >
                {/* Preview Box */}
                <div className="bg-checkered relative flex h-24 w-full items-center justify-center rounded-lg border border-white/[0.04] p-1.5 overflow-hidden">
                  {asset.type === 'svg' && asset.content ? (
                    <div
                      className="flex h-full w-full items-center justify-center [&>svg]:max-h-full [&>svg]:max-w-full text-[#faf9f5]"
                      dangerouslySetInnerHTML={{ __html: asset.content }}
                    />
                  ) : asset.type === 'video' ? (
                    <div className="relative flex h-full w-full items-center justify-center bg-black/60 rounded overflow-hidden">
                      <video
                        src={asset.url}
                        poster={asset.poster}
                        muted
                        playsInline
                        loop
                        onMouseEnter={(e) => {
                          try {
                            e.currentTarget.play();
                          } catch {}
                        }}
                        onMouseLeave={(e) => {
                          try {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          } catch {}
                        }}
                        className="max-h-full max-w-full object-contain"
                      />
                      <div className="absolute top-1 left-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] font-mono font-medium text-white/90 backdrop-blur-xs">
                        <Play className="h-2 w-2 fill-current" />
                        <span>{asset.format?.toUpperCase() || 'VIDEO'}</span>
                      </div>
                    </div>
                  ) : asset.type === 'audio' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#141413] rounded">
                      <Volume2 className="h-6 w-6 text-[#a8a29e]" />
                      <span className="text-[9px] font-mono text-[#78716c] uppercase">
                        {asset.format || 'AUDIO'}
                      </span>
                    </div>
                  ) : asset.type === 'lottie' ? (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#141413] rounded">
                      <Sparkles className="h-6 w-6 text-amber-400" />
                      <span className="text-[9px] font-mono text-[#a8a29e] uppercase">
                        {asset.format || 'LOTTIE'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={asset.previewUrl || asset.url}
                      alt={asset.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Details Footer */}
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="truncate max-w-[90px] font-medium text-[#faf9f5]" title={asset.name}>
                    {asset.name}
                  </span>
                  <span className="font-mono text-[#78716c] uppercase text-[9px] shrink-0">
                    {asset.format || asset.type}
                  </span>
                </div>

                {/* Metadata Row: dimensions or duration */}
                <div className="mt-0.5 flex items-center justify-between text-[9px] font-mono text-[#57534e]">
                  <span>
                    {asset.width && asset.height
                      ? `${asset.width}×${asset.height}`
                      : asset.duration
                      ? `${asset.duration}s`
                      : asset.type}
                  </span>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-[#141413]/85 opacity-0 backdrop-blur-xs transition group-hover:opacity-100 p-2">
                  {asset.type === 'svg' && asset.content && (
                    <button
                      onClick={() => handleCopySvg(asset)}
                      title="Copy SVG XML"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.1] text-[#faf9f5] hover:bg-white/[0.2] transition"
                    >
                      {isCopiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}

                  <button
                    onClick={() => handleCopyUrl(asset)}
                    title="Copy URL"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.1] text-[#faf9f5] hover:bg-white/[0.2] transition"
                  >
                    {isCopiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <LinkIcon className="h-3.5 w-3.5" />}
                  </button>

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
