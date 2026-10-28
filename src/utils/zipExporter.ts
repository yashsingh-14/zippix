import JSZip from 'jszip';
import type { ExtractedAsset, DesignTokens } from '../types';

export async function exportCloneZip(
  fullHtml: string,
  domain: string = 'website'
): Promise<Blob> {
  const zip = new JSZip();

  // Extract master styles if present to create separate styles.css
  let html = fullHtml;
  let css = '';

  const styleMatch = html.match(/<style data-zippix="(?:master-styles|master-cloned-styles)">([\s\S]*?)<\/style>/);
  if (styleMatch) {
    css = styleMatch[1];
    html = html.replace(
      styleMatch[0],
      '<link rel="stylesheet" href="styles.css">\n'
    );
  } else {
    // Collect all <style> tags
    const styles: string[] = [];
    html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, content) => {
      styles.push(content);
      return '';
    });
    css = styles.join('\n\n');
    html = html.replace('</head>', '<link rel="stylesheet" href="styles.css">\n</head>');
  }

  const folderName = domain.replace(/[^a-z0-9_-]/gi, '-').toLowerCase() || 'website-clone';
  const folder = zip.folder(folderName) || zip;

  folder.file('index.html', html);
  folder.file('styles.css', css);

  return await zip.generateAsync({ type: 'blob' });
}

export async function exportAssetsZip(
  assets: ExtractedAsset[],
  tokens?: DesignTokens,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();

  const svgFolder = zip.folder('svgs');
  const imgFolder = zip.folder('images');
  const videoFolder = zip.folder('videos');
  const audioFolder = zip.folder('audio');
  const lottieFolder = zip.folder('lotties');
  const bgFolder = zip.folder('backgrounds');

  let processed = 0;
  const total = assets.length + (tokens ? 1 : 0);

  for (const asset of assets) {
    try {
      if (asset.type === 'svg') {
        const cleanName = asset.name.replace(/[^a-z0-9_-]/gi, '_') || 'icon';
        const filename = cleanName.toLowerCase().endsWith('.svg') ? cleanName : `${cleanName}.svg`;
        const content = asset.content || '';
        svgFolder?.file(filename, content);
      } else if (asset.type === 'lottie' && asset.content) {
        const cleanName = asset.name.replace(/[^a-z0-9_-]/gi, '_') || 'animation';
        const filename = cleanName.toLowerCase().endsWith('.json') ? cleanName : `${cleanName}.json`;
        lottieFolder?.file(filename, asset.content);
      } else {
        const response = await fetch(asset.url);
        if (response.ok) {
          const blob = await response.blob();
          const ext = asset.format || (asset.type === 'video' ? 'mp4' : asset.type === 'audio' ? 'mp3' : 'png');
          const cleanName = asset.name.replace(/[^a-z0-9_-]/gi, '_') || asset.type;
          const filename = cleanName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
            ? cleanName
            : `${cleanName}.${ext}`;

          if (asset.type === 'video') {
            videoFolder?.file(filename, blob);
          } else if (asset.type === 'audio') {
            audioFolder?.file(filename, blob);
          } else if (asset.type === 'lottie') {
            lottieFolder?.file(filename, blob);
          } else if (asset.type === 'background') {
            bgFolder?.file(filename, blob);
          } else {
            imgFolder?.file(filename, blob);
          }
        }
      }
    } catch (e) {
      console.warn(`Could not package asset ${asset.url}:`, e);
    }
    processed++;
    onProgress?.(Math.round((processed / total) * 100));
  }

  if (tokens) {
    zip.file('design-tokens.json', JSON.stringify(tokens, null, 2));
    processed++;
    onProgress?.(100);
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
