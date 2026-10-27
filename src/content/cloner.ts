/**
 * Ultimate 1:1 Pixel-Perfect Page & Component Cloner
 * Handles WebGL/Canvas snapshots, HTML5 Videos, CSS 3D Transforms,
 * Background Images, Lazy-loaded Images, Webfonts, and Animation States.
 */

export async function cloneFullPageHtml(): Promise<string> {
  const currentUrl = window.location.href;

  // 1. Snapshot any live <canvas> elements (Three.js / WebGL / 2D)
  const canvasSnapshots = new Map<number, string>();
  const liveCanvases = document.querySelectorAll('canvas');
  liveCanvases.forEach((canvas, index) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 100) {
        canvasSnapshots.set(index, dataUrl);
      }
    } catch (e) {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width || canvas.clientWidth || 300;
        offscreen.height = canvas.height || canvas.clientHeight || 150;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0);
          canvasSnapshots.set(index, offscreen.toDataURL('image/png'));
        }
      } catch (err2) {}
    }
  });

  // 2. Clone the live document
  const docClone = document.documentElement.cloneNode(true) as HTMLElement;

  // 3. Remove Zippix inspector overlay
  docClone.querySelector('#zippix-inspector-root')?.remove();

  // 4. Clean scripts to prevent local file crash or Next.js redirect
  docClone.querySelectorAll('script').forEach((s) => s.remove());

  // 5. Ensure <base href="..."> at the very top of <head>
  let head = docClone.querySelector('head');
  if (!head) {
    head = document.createElement('head');
    docClone.insertBefore(head, docClone.firstChild);
  }
  head.querySelectorAll('base').forEach((b) => b.remove());
  const baseTag = document.createElement('base');
  baseTag.setAttribute('href', currentUrl);
  head.insertBefore(baseTag, head.firstChild);

  // 6. Replace cloned <canvas> with snapshot images
  const clonedCanvases = docClone.querySelectorAll('canvas');
  clonedCanvases.forEach((cloned, index) => {
    const dataUrl = canvasSnapshots.get(index);
    if (dataUrl) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.setAttribute('style', cloned.getAttribute('style') || '');
      img.className = cloned.className;
      cloned.replaceWith(img);
    }
  });

  // 7. Fix all <video> elements (ensure autoplay, loop, muted, playsinline)
  const liveVideos = document.querySelectorAll('video');
  const clonedVideos = docClone.querySelectorAll('video');
  clonedVideos.forEach((cloned, index) => {
    const live = liveVideos[index];
    const src = (live && (live.currentSrc || live.src)) || cloned.currentSrc || cloned.src;
    if (src) {
      try {
        cloned.src = new URL(src, currentUrl).href;
      } catch {
        cloned.src = src;
      }
    }
    cloned.setAttribute('autoplay', '');
    cloned.setAttribute('loop', '');
    cloned.setAttribute('muted', '');
    cloned.setAttribute('playsinline', '');
    cloned.removeAttribute('controls');
  });

  // 8. Fix all <img> and <picture> sources with absolute URLs & eager loading
  const liveImages = document.querySelectorAll('img');
  const clonedImages = docClone.querySelectorAll('img');
  clonedImages.forEach((img, index) => {
    const live = liveImages[index];
    const src = (live && (live.currentSrc || live.src)) || img.getAttribute('src');
    if (src) {
      try {
        img.src = new URL(src, currentUrl).href;
      } catch {
        img.src = src;
      }
    }
    img.setAttribute('loading', 'eager');
    img.removeAttribute('decoding');

    const srcset = img.getAttribute('srcset');
    if (srcset) {
      try {
        const resolved = srcset
          .split(',')
          .map((part) => {
            const [url, size] = part.trim().split(/\s+/);
            if (!url.startsWith('http') && !url.startsWith('//') && !url.startsWith('data:')) {
              return `${new URL(url, currentUrl).href} ${size || ''}`.trim();
            }
            return part.trim();
          })
          .join(', ');
        img.setAttribute('srcset', resolved);
      } catch (e) {}
    }
  });

  // Fix <source> tags in <picture> and <video>
  docClone.querySelectorAll('source').forEach((source) => {
    const src = source.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      try {
        source.setAttribute('src', new URL(src, currentUrl).href);
      } catch {}
    }
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      try {
        const resolved = srcset
          .split(',')
          .map((part) => {
            const [url, size] = part.trim().split(/\s+/);
            if (!url.startsWith('http') && !url.startsWith('//') && !url.startsWith('data:')) {
              return `${new URL(url, currentUrl).href} ${size || ''}`.trim();
            }
            return part.trim();
          })
          .join(', ');
        source.setAttribute('srcset', resolved);
      } catch {}
    }
  });

  // 9. Sync computed visual styles & 3D transforms for elements (like tilted cards, hero banners)
  const liveElements = document.querySelectorAll('*');
  const clonedElements = docClone.querySelectorAll('*');
  const count = Math.min(liveElements.length, clonedElements.length);

  for (let i = 0; i < count; i++) {
    const live = liveElements[i] as HTMLElement;
    const cloned = clonedElements[i] as HTMLElement;
    if (live && cloned && live.nodeType === 1) {
      try {
        const comp = window.getComputedStyle(live);

        // Background image preservation
        if (comp.backgroundImage && comp.backgroundImage !== 'none' && comp.backgroundImage.includes('url(')) {
          // Rewrite relative URLs inside background-image to absolute
          const absBg = comp.backgroundImage.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, relUrl) => {
            if (relUrl.startsWith('data:') || relUrl.startsWith('http')) return match;
            try {
              return `url("${new URL(relUrl, currentUrl).href}")`;
            } catch {
              return match;
            }
          });
          cloned.style.backgroundImage = absBg;
          cloned.style.backgroundSize = comp.backgroundSize;
          cloned.style.backgroundPosition = comp.backgroundPosition;
          cloned.style.backgroundRepeat = comp.backgroundRepeat;
        }

        // 3D Transform preservation (for tilted chocolate boxes, cards, 3D containers)
        if (comp.transform && comp.transform !== 'none' && !cloned.style.transform) {
          cloned.style.transform = comp.transform;
          cloned.style.transformOrigin = comp.transformOrigin;
          cloned.style.transformStyle = comp.transformStyle;
        }

        // Ensure visible elements stay visible (bypass initial opacity:0 from unfinished JS animations)
        const opacityVal = parseFloat(comp.opacity);
        if (opacityVal > 0.05 && comp.display !== 'none' && comp.visibility !== 'hidden') {
          if (cloned.style.opacity === '0') {
            cloned.style.opacity = '1';
          }
          if (cloned.style.visibility === 'hidden') {
            cloned.style.visibility = 'visible';
          }
        }
      } catch (err) {}
    }
  }

  // 10. Extract & Inline all Stylesheets (with relative url() rewritten to absolute)
  let inlinedStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            // Rewrite any url(...) inside CSS rules to absolute URL
            const rewritten = rule.cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, relUrl) => {
              if (relUrl.startsWith('data:') || relUrl.startsWith('http')) return match;
              try {
                return `url("${new URL(relUrl, sheet.href || currentUrl).href}")`;
              } catch {
                return match;
              }
            });
            inlinedStyles += rewritten + '\n';
          }
        }
      } catch (e) {
        // Cross-origin stylesheet - link tag handles it
      }
    }
  } catch (e) {}

  // Resolve external <link rel="stylesheet">
  docClone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
      try {
        link.setAttribute('href', new URL(href, currentUrl).href);
      } catch {}
    }
  });

  // Inject inlined stylesheet
  if (inlinedStyles) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-zippix', 'master-inlined-styles');
    styleEl.textContent = inlinedStyles;
    head.appendChild(styleEl);
  }

  // Add auto-play / smooth display helper styles
  const helperStyle = document.createElement('style');
  helperStyle.textContent = `
    /* Zippix Fidelity Assurance */
    *, *::before, *::after {
      animation-play-state: running !important;
    }
    video {
      pointer-events: auto !important;
    }
  `;
  head.appendChild(helperStyle);

  return `<!DOCTYPE html>\n` + docClone.outerHTML;
}

export function cloneComponentHtml(targetEl: HTMLElement): string {
  const currentUrl = window.location.href;
  const bodyComp = window.getComputedStyle(document.body);

  const clone = targetEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script').forEach((s) => s.remove());

  let inlinedStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            const rewritten = rule.cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, relUrl) => {
              if (relUrl.startsWith('data:') || relUrl.startsWith('http')) return match;
              try {
                return `url("${new URL(relUrl, sheet.href || currentUrl).href}")`;
              } catch {
                return match;
              }
            });
            inlinedStyles += rewritten + '\n';
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Clone — ${targetEl.tagName.toLowerCase()}</title>
  <base href="${currentUrl}">
  <style>
    * { box-sizing: border-box; }
    body {
      background-color: ${bodyComp.backgroundColor || '#0b0f19'};
      color: ${bodyComp.color || '#f1f5f9'};
      font-family: ${bodyComp.fontFamily};
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px 20px;
      margin: 0;
    }
    ${inlinedStyles}
  </style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;
}
