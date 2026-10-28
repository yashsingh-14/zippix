import type { ExtractedAsset } from '../types';
import { cleanAndSerializeSvg, svgToDataUri } from '../utils/svgUtils';

function cleanFilename(url: string, fallback: string): string {
  try {
    const pathname = new URL(url, window.location.href).pathname;
    const parts = pathname.split('/').filter(Boolean);
    const last = parts.pop() || fallback;
    return decodeURIComponent(last).split('?')[0].split('#')[0] || fallback;
  } catch {
    return fallback;
  }
}

export function huntAssets(): ExtractedAsset[] {
  const assets: ExtractedAsset[] = [];
  const seenUrls = new Set<string>();
  const seenSvgs = new Set<string>();

  // 1. Hunt SVG elements
  const svgs = document.querySelectorAll('svg');
  let svgCount = 0;
  svgs.forEach((svg) => {
    // Avoid hidden 0x0 empty svgs
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && !svg.querySelector('path, circle, rect, polygon, polyline')) {
      return;
    }

    try {
      const cleanSvg = cleanAndSerializeSvg(svg);
      const signature = cleanSvg.slice(0, 100) + cleanSvg.length;
      if (seenSvgs.has(signature)) return;
      seenSvgs.add(signature);

      svgCount++;
      const id = `svg-${svgCount}`;
      const name =
        svg.getAttribute('aria-label') ||
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
    } catch {}
  });

  // 2. Hunt HTML5 Video elements & streams
  const videos = document.querySelectorAll('video');
  let videoCount = 0;
  videos.forEach((video) => {
    const videoSources: string[] = [];
    const mainSrc = video.currentSrc || video.src || video.getAttribute('data-src');
    if (mainSrc) videoSources.push(mainSrc);

    video.querySelectorAll('source').forEach((s) => {
      const sSrc = s.src || s.getAttribute('src') || s.getAttribute('data-src');
      if (sSrc) videoSources.push(sSrc);
    });

    for (const rawUrl of videoSources) {
      if (!rawUrl || rawUrl.startsWith('blob:') || seenUrls.has(rawUrl)) continue;

      let absUrl = rawUrl;
      try {
        absUrl = new URL(rawUrl, window.location.href).href;
      } catch {}

      if (seenUrls.has(absUrl)) continue;
      seenUrls.add(absUrl);
      videoCount++;

      const filename = cleanFilename(absUrl, `video-${videoCount}.mp4`);
      const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
      const poster = video.poster ? new URL(video.poster, window.location.href).href : undefined;

      assets.push({
        id: `video-${videoCount}`,
        type: 'video',
        name: filename,
        url: absUrl,
        previewUrl: poster || absUrl,
        poster,
        width: video.videoWidth || video.clientWidth || 640,
        height: video.videoHeight || video.clientHeight || 360,
        format: ext,
        duration: Math.round(video.duration) || undefined,
      });
    }
  });

  // 3. Hunt <img> and <picture> elements (including lazy-loaded data-src)
  const images = document.querySelectorAll('img');
  let imgCount = 0;
  images.forEach((img) => {
    let src =
      img.currentSrc ||
      img.src ||
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy-src') ||
      '';

    // If placeholder, try picking from srcset
    if (!src || src.startsWith('data:image/svg+xml;base64,PHN2Zy')) {
      const ss = img.getAttribute('srcset') || img.srcset || '';
      if (ss) {
        const parts = ss.split(',').map((p) => p.trim().split(/\s+/)[0]);
        if (parts.length > 0 && parts[parts.length - 1]) {
          src = parts[parts.length - 1];
        }
      }
    }

    if (!src || seenUrls.has(src)) return;

    // Filter out 1x1 tracking pixels
    if (img.naturalWidth === 1 && img.naturalHeight === 1) return;

    let absUrl = src;
    try {
      absUrl = src.startsWith('data:') ? src : new URL(src, window.location.href).href;
    } catch {}

    if (seenUrls.has(absUrl)) return;
    seenUrls.add(absUrl);
    imgCount++;

    const isSvg = absUrl.includes('.svg') || absUrl.startsWith('data:image/svg+xml');
    const filename = cleanFilename(absUrl, `image-${imgCount}`);
    const ext = isSvg ? 'svg' : filename.split('.').pop()?.toLowerCase() || 'png';

    assets.push({
      id: `img-${imgCount}`,
      type: isSvg ? 'svg' : 'image',
      name: img.alt || filename,
      url: absUrl,
      previewUrl: absUrl,
      width: img.naturalWidth || img.clientWidth || undefined,
      height: img.naturalHeight || img.clientHeight || undefined,
      format: ext,
    });
  });

  // 4. Hunt Lottie Animations
  let lottieCount = 0;
  document.querySelectorAll('lottie-player, dotlottie-player, [data-animation-path], [data-lottie]').forEach((el) => {
    const rawSrc =
      el.getAttribute('src') ||
      el.getAttribute('data-src') ||
      el.getAttribute('data-animation-path') ||
      el.getAttribute('data-lottie');

    if (!rawSrc || seenUrls.has(rawSrc)) return;

    try {
      const absUrl = new URL(rawSrc, window.location.href).href;
      if (seenUrls.has(absUrl)) return;
      seenUrls.add(absUrl);
      lottieCount++;

      const filename = cleanFilename(absUrl, `animation-${lottieCount}.json`);
      assets.push({
        id: `lottie-${lottieCount}`,
        type: 'lottie',
        name: filename,
        url: absUrl,
        previewUrl: absUrl,
        format: absUrl.endsWith('.lottie') ? 'lottie' : 'json',
      });
    } catch {}
  });

  // 5. Hunt Audio elements
  let audioCount = 0;
  document.querySelectorAll('audio').forEach((audio) => {
    const sources: string[] = [];
    if (audio.src) sources.push(audio.src);
    audio.querySelectorAll('source').forEach((s) => {
      if (s.src) sources.push(s.src);
    });

    for (const rawUrl of sources) {
      if (!rawUrl || seenUrls.has(rawUrl)) continue;
      try {
        const absUrl = new URL(rawUrl, window.location.href).href;
        if (seenUrls.has(absUrl)) continue;
        seenUrls.add(absUrl);
        audioCount++;

        const filename = cleanFilename(absUrl, `audio-${audioCount}.mp3`);
        const ext = filename.split('.').pop()?.toLowerCase() || 'mp3';
        assets.push({
          id: `audio-${audioCount}`,
          type: 'audio',
          name: filename,
          url: absUrl,
          previewUrl: absUrl,
          format: ext,
        });
      } catch {}
    }
  });

  // 6. Hunt CSS background-image
  const allElements = document.querySelectorAll('*');
  let bgCount = 0;
  const sampleLimit = Math.min(allElements.length, 300);

  for (let i = 0; i < sampleLimit; i++) {
    const el = allElements[i] as HTMLElement;
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg.startsWith('url(') && !bg.includes('data:image/svg+xml')) {
      const match = bg.match(/url\(["']?([^"']+)["']?\)/);
      if (match && match[1]) {
        const url = match[1];
        if (!seenUrls.has(url)) {
          let absUrl = url;
          try {
            absUrl = new URL(url, window.location.href).href;
          } catch {}

          if (!seenUrls.has(absUrl)) {
            seenUrls.add(absUrl);
            bgCount++;
            const name = cleanFilename(absUrl, `background-${bgCount}`);
            const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
            assets.push({
              id: `bg-${bgCount}`,
              type: 'background',
              name,
              url: absUrl,
              previewUrl: absUrl,
              format: ext,
            });
          }
        }
      }
    }
  }

  return assets;
}
