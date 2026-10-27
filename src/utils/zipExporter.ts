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

  const styleMatch = html.match(/<style data-zippix="master-cloned-styles">([\s\S]*?)<\/style>/);
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

  let processed = 0;
  const total = assets.length + (tokens ? 1 : 0);

  // Add SVGs
  for (const asset of assets) {
    if (asset.type === 'svg') {
      const filename = `${asset.name.replace(/[^a-z0-9_-]/gi, '_') || 'icon'}.svg`;
      const content = asset.content || '';
      svgFolder?.file(filename, content);
      processed++;
      onProgress?.(Math.round((processed / total) * 100));
    } else {
      try {
        const response = await fetch(asset.url);
        if (response.ok) {
          const blob = await response.blob();
          const ext = asset.format || 'png';
          const filename = `${asset.name.replace(/[^a-z0-9_-]/gi, '_') || 'image'}.${ext}`;
          imgFolder?.file(filename, blob);
        }
      } catch (e) {
        console.warn(`Could not fetch asset: ${asset.url}`, e);
      }
      processed++;
      onProgress?.(Math.round((processed / total) * 100));
    }
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
