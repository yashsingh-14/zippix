import type { ExtractedAsset } from '../types';
import { cleanAndSerializeSvg, svgToDataUri } from '../utils/svgUtils';

export function huntAssets(): ExtractedAsset[] {
  const assets: ExtractedAsset[] = [];
  const seenUrls = new Set<string>();
  const seenSvgs = new Set<string>();

  // 1. Hunt SVG elements
  const svgs = document.querySelectorAll('svg');
  let svgCount = 0;
  svgs.forEach((svg) => {
    // Avoid tiny or hidden 0x0 svgs
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && !svg.querySelector('path, circle, rect')) {
      return;
    }

    try {
      const cleanSvg = cleanAndSerializeSvg(svg);
      // Deduplicate by string content hash or signature
      const signature = cleanSvg.slice(0, 100) + cleanSvg.length;
      if (seenSvgs.has(signature)) return;
      seenSvgs.add(signature);

      svgCount++;
      const id = `svg-${svgCount}`;
      const name = svg.getAttribute('aria-label') ||
                   svg.getAttribute('id') ||
                   svg.closest('[aria-label]')?.getAttribute('aria-label') ||
                   `icon-${svgCount}`;

      assets.push({
        id,
        type: 'svg',
        name,
        url: svgToDataUri(cleanSvg),
        previewUrl: svgToDataUri(cleanSvg),
        content: cleanSvg,
        width: Math.round(rect.width) || 24,
        height: Math.round(rect.height) || 24,
        format: 'svg',
      });
    } catch (e) {
      // Ignore invalid SVGs
    }
  });

  // 2. Hunt <img> and <picture> elements
  const images = document.querySelectorAll('img');
  let imgCount = 0;
  images.forEach((img) => {
    const src = img.currentSrc || img.src;
    if (!src || src.startsWith('data:image/svg+xml') || seenUrls.has(src)) return;

    // Filter out 1x1 tracking pixels
    if (img.naturalWidth === 1 && img.naturalHeight === 1) return;

    seenUrls.add(src);
    imgCount++;

    const name = img.alt ||
                 src.split('/').pop()?.split('?')[0] ||
                 `image-${imgCount}`;

    const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';

    assets.push({
      id: `img-${imgCount}`,
      type: 'image',
      name,
      url: src,
      previewUrl: src,
      width: img.naturalWidth || img.clientWidth,
      height: img.naturalHeight || img.clientHeight,
      format: ext,
    });
  });

  // 3. Hunt CSS background-image
  const allElements = document.querySelectorAll('*');
  let bgCount = 0;
  const sampleLimit = Math.min(allElements.length, 300); // Sample for performance

  for (let i = 0; i < sampleLimit; i++) {
    const el = allElements[i] as HTMLElement;
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg.startsWith('url(') && !bg.includes('data:image/svg+xml')) {
      const match = bg.match(/url\(["']?([^"']+)["']?\)/);
      if (match && match[1]) {
        const url = match[1];
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          bgCount++;
          const name = url.split('/').pop()?.split('?')[0] || `bg-${bgCount}`;
          assets.push({
            id: `bg-${bgCount}`,
            type: 'background',
            name,
            url,
            previewUrl: url,
            format: 'image',
          });
        }
      }
    }
  }

  return assets;
}
