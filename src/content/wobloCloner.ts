import JSZip from 'jszip';

// Fetch helper with multi-tier fallback (Content script -> Background worker)
async function fetchResource(url: string, asDataUrl = false): Promise<string | null> {
  // 1. Try direct fetch in current page context
  try {
    const res = await fetch(url);
    if (res.ok) {
      if (asDataUrl) {
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        return await res.text();
      }
    }
  } catch {}

  // 2. Fallback: Ask background service worker (bypasses CSP & CORS with host_permissions)
  try {
    const bgData = await new Promise<string | null>((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'FETCH_RESOURCE', url, asDataUrl },
        (response) => {
          if (!chrome.runtime.lastError && response?.status === 'ok' && response.data) {
            resolve(response.data);
          } else {
            resolve(null);
          }
        }
      );
    });
    if (bgData) return bgData;
  } catch {}

  return null;
}

// Extract rules directly from browser's live CSSOM if network fetch is blocked
function getCssFromCssom(sheetAbsUrl: string): string | null {
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      if (sheet.href) {
        try {
          const abs = new URL(sheet.href, window.location.href).href;
          if (abs === sheetAbsUrl) {
            const rules = sheet.cssRules || sheet.rules;
            if (rules && rules.length > 0) {
              return Array.from(rules).map((r) => r.cssText).join('\n');
            }
          }
        } catch {}
      }
    }
  } catch {}
  return null;
}

export interface CloneOptions {
  stripScripts?: boolean;
  inlineImages?: boolean;
  onProgress?: (info: { stage: string; current: number; total: number; message?: string }) => void;
}

/**
 * Zippix Master 1:1 Page Cloner (Woblo-Grade High-Fidelity Engine)
 * Replicates complete website page with 100% fidelity:
 * - Direct live DOM serialization (no destructive computed style matrix stamping)
 * - Complete stylesheet extraction into styles.css with multi-tier fallback (CSSOM + Background)
 * - Image conversion to Base64 Data URLs for guaranteed offline rendering
 * - Preserves HTML5 video streams and centers hero background videos
 * - Interactive runtime engine for smooth hamburger menu open/close ('X' animation)
 * - Continuous infinite marquee scrolling effect
 * - Strips Next.js framework hydration chunks to eliminate "This page couldn't load"
 * - Packages into <siteName>.full-page.Zippix.zip containing index.html and styles.css
 */
export async function generateClonedPackage(options?: CloneOptions): Promise<{
  html: string;
  css: string;
  siteName: string;
  zipBlob: Blob;
}> {
  const currentUrl = window.location.href;
  const rawHtml = document.documentElement.outerHTML;
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  // 1. Remove Zippix inspector roots and overlays
  doc.querySelector('#zippix-inspector-root')?.remove();
  doc.querySelectorAll('[data-zippix-overlay]').forEach((el) => el.remove());

  // 2. Remove full-page blocking splash screens (0% loader overlays)
  doc.querySelectorAll('.fixed.z-50.bg-dark-brown, [class*="loading-overlay"]').forEach((el) => {
    el.remove();
  });

  // 3. Guarantee Header is visible and interactive
  doc.querySelectorAll('header, [class*="header"]').forEach((h) => {
    (h as HTMLElement).style.setProperty('opacity', '1', 'important');
    (h as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
    (h as HTMLElement).style.setProperty('visibility', 'visible', 'important');
  });

  // 4. Remove any existing <base> tag so local styles.css resolves locally
  doc.querySelectorAll('base').forEach((b) => b.remove());

  // 5. Clean up scripts to prevent Next.js ErrorBoundary crash on local file://
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src');
    if (src) {
      if (
        src.includes('googletagmanager.com') ||
        src.includes('google-analytics.com') ||
        src.includes('connect.facebook.net') ||
        src.includes('hotjar.com') ||
        src.includes('/_next/static/chunks/') ||
        src.includes('turbopack') ||
        src.includes('webpack')
      ) {
        s.remove();
        return;
      }
      try {
        s.setAttribute('src', new URL(src, currentUrl).href);
        s.setAttribute('crossorigin', 'anonymous');
      } catch {}
    } else {
      // Remove inline Next.js Flight/RSC streaming scripts
      const text = s.textContent || '';
      if (text.includes('__next_f') || text.includes('self.__next_f')) {
        s.remove();
      }
    }
  });

  // 6. Preload links: NEVER remove stylesheets!
  doc.querySelectorAll('link').forEach((link) => {
    const rel = (link.getAttribute('rel') || '').toLowerCase();
    // Do NOT touch stylesheet links here; they are processed in step 8
    if (rel === 'stylesheet') {
      return;
    }

    const href = link.getAttribute('href');
    // Remove JS chunk preloads that could cause script 404s
    if (href && (href.includes('/_next/static/chunks/') || href.includes('turbopack'))) {
      link.remove();
      return;
    }
    // Make relative favicon/font links absolute
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
      try {
        link.setAttribute('href', new URL(href, currentUrl).href);
      } catch {}
    }
  });

  // Make relative <a> tags absolute
  doc.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (
      href &&
      !href.startsWith('http') &&
      !href.startsWith('//') &&
      !href.startsWith('#') &&
      !href.startsWith('javascript:') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:')
    ) {
      try {
        a.setAttribute('href', new URL(href, currentUrl).href);
      } catch {}
    }
  });

  // 7. Snapshot <canvas> elements (WebGL / Three.js)
  const liveCanvases = document.querySelectorAll('canvas');
  const clonedCanvases = doc.querySelectorAll('canvas');
  liveCanvases.forEach((cv, idx) => {
    try {
      const dataUrl = cv.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 100 && clonedCanvases[idx]) {
        clonedCanvases[idx].style.backgroundImage = `url("${dataUrl}")`;
        clonedCanvases[idx].style.backgroundSize = 'contain';
        clonedCanvases[idx].style.backgroundPosition = 'center';
        clonedCanvases[idx].style.backgroundRepeat = 'no-repeat';
      }
    } catch {}
  });

  // 8. Fix HTML5 Videos (Autoplay, Loop, Muted, Absolute URLs, Hero positioning)
  const liveVideos = document.querySelectorAll('video');
  const clonedVideos = doc.querySelectorAll('video');
  clonedVideos.forEach((clonedV, idx) => {
    const liveV = liveVideos[idx];
    const vSrc = (liveV && (liveV.currentSrc || liveV.src)) || clonedV.currentSrc || clonedV.src;
    if (vSrc && !vSrc.startsWith('data:') && !vSrc.startsWith('blob:')) {
      try {
        clonedV.src = new URL(vSrc, currentUrl).href;
      } catch {
        clonedV.src = vSrc;
      }
    }

    clonedV.querySelectorAll('source').forEach((source) => {
      const sSrc = source.getAttribute('src');
      if (sSrc && !sSrc.startsWith('data:') && !sSrc.startsWith('blob:')) {
        try {
          source.setAttribute('src', new URL(sSrc, currentUrl).href);
        } catch {}
      }
    });

    clonedV.setAttribute('autoplay', '');
    clonedV.setAttribute('loop', '');
    clonedV.setAttribute('muted', '');
    clonedV.setAttribute('playsinline', '');

    // Active flavor video positioning (e.g. Baklawa)
    if (liveV) {
      const liveStyle = window.getComputedStyle(liveV);
      const isVisible =
        liveStyle.display !== 'none' && liveStyle.visibility !== 'hidden' && liveStyle.opacity !== '0';
      if (isVisible || clonedV.id.includes('baklawa')) {
        clonedV.classList.remove('hidden', 'opacity-0');
        (clonedV as HTMLElement).style.removeProperty('display');
        (clonedV as HTMLElement).style.setProperty('opacity', '1', 'important');
      }
    }
  });

  // 9. Extract ALL CSS into styles.css (Multi-tier extraction: Network -> Background -> CSSOM)
  const stylesheetLinks = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  const processedUrls = new Set<string>();

  const cssPromises = stylesheetLinks.map(async (linkEl, index) => {
    const href = linkEl.getAttribute('href');
    if (!href) return '';
    const absUrl = new URL(href, currentUrl).href;
    processedUrls.add(absUrl);

    options?.onProgress?.({
      stage: 'css',
      current: index + 1,
      total: stylesheetLinks.length,
      message: `Extracting stylesheet ${index + 1}/${stylesheetLinks.length}`,
    });

    try {
      // Tier 1: Try network / background fetch
      let cssContent = await fetchResource(absUrl);

      // Tier 2: Try browser's live CSSOM if fetch returned null
      if (!cssContent) {
        cssContent = getCssFromCssom(absUrl);
      }

      if (cssContent === null || !cssContent.trim()) {
        linkEl.setAttribute('href', absUrl);
        return `/* Retained external stylesheet: ${absUrl} */\n`;
      }

      linkEl.remove();

      // Rewrite relative url(...) to absolute URLs
      const rewrittenCss = cssContent.replace(
        /url\((?!['"]?(?:data|https?|ftp):)['"]?([^'")]+)['"]?\)/g,
        (_match, rel) => {
          try {
            return `url("${new URL(rel, absUrl).href}")`;
          } catch {
            return `url("${rel}")`;
          }
        }
      );
      return `/* Source: ${absUrl} */\n${rewrittenCss}\n\n`;
    } catch {
      linkEl.setAttribute('href', absUrl);
      return `/* Error extracting: ${absUrl} */\n`;
    }
  });

  let masterCss = (await Promise.all(cssPromises)).join('');

  // Collect and remove all inline <style> tags
  doc.querySelectorAll('style').forEach((st) => {
    const text = st.textContent || '';
    if (text.trim()) {
      masterCss += `/* Inline Style */\n${text}\n\n`;
    }
    st.remove();
  });

  // Tier 3: Extract any CSS-in-JS (Emotion, styled-components, constructed sheets) from document.styleSheets
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const sheetHref = sheet.href ? new URL(sheet.href, currentUrl).href : null;
        if (!sheetHref || !processedUrls.has(sheetHref)) {
          const rules = sheet.cssRules || sheet.rules;
          if (rules && rules.length > 0) {
            const rulesText = Array.from(rules)
              .map((r) => r.cssText)
              .join('\n');
            if (rulesText.trim() && !masterCss.includes(rulesText.slice(0, 100))) {
              masterCss += `/* In-Memory / CSSOM Rules */\n${rulesText}\n\n`;
            }
          }
        }
      } catch {}
    }
  } catch {}

  // Append essential animation, layout, video centering and marquee rules
  const essentialRules = `
    /* === Zippix Fidelity Rules === */
    @keyframes zippixMarquee {
      0% { transform: translate(0, var(--tw-translate-y, 0%)); }
      100% { transform: translate(var(--marquee-shift, -50%), var(--tw-translate-y, 0%)); }
    }
    @-webkit-keyframes zippixMarquee {
      0% { -webkit-transform: translate(0, var(--tw-translate-y, 0%)); }
      100% { -webkit-transform: translate(var(--marquee-shift, -50%), var(--tw-translate-y, 0%)); }
    }
    [class*="animate-marquee"], .animate-marquee, [class*="motion-safe:animate-marquee"] {
      -webkit-animation: zippixMarquee var(--marquee-duration, 10.75s) linear infinite !important;
      animation: zippixMarquee var(--marquee-duration, 10.75s) linear infinite !important;
      display: flex !important;
      will-change: transform !important;
    }

    header, [class*="header"] {
      opacity: 1 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }

    video.mask-ingredient-video:not(.hidden) {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      object-fit: cover !important;
      opacity: 1 !important;
      display: block !important;
    }
  `;
  masterCss += essentialRules;

  // Insert single styles.css link into <head>
  let head = doc.querySelector('head');
  if (!head) {
    head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
  }
  const linkCss = doc.createElement('link');
  linkCss.rel = 'stylesheet';
  linkCss.href = 'styles.css';
  head.appendChild(linkCss);

  // 10. Convert <img> sources to Base64 Data URLs (Woblo technique)
  const liveImages = document.querySelectorAll('img');
  const clonedImages = [...doc.querySelectorAll('img')];
  await Promise.all(
    clonedImages.map(async (img, idx) => {
      const live = liveImages[idx];
      const rawSrc = (live && (live.currentSrc || live.src)) || img.getAttribute('src') || '';
      if (rawSrc) {
        const absSrc = rawSrc.startsWith('data:') ? rawSrc : new URL(rawSrc, currentUrl).href;
        if (absSrc.startsWith('http')) {
          options?.onProgress?.({
            stage: 'images',
            current: idx + 1,
            total: clonedImages.length,
            message: `Inlining image ${idx + 1}/${clonedImages.length}`,
          });
          const dataUrl = await fetchResource(absSrc, true);
          if (dataUrl) {
            img.setAttribute('src', dataUrl);
            img.removeAttribute('srcset');
          } else {
            img.setAttribute('src', absSrc);
          }
        }
      }
      img.setAttribute('loading', 'eager');
      img.removeAttribute('decoding');
    })
  );

  // 11. Embed Master Interactive Runtime Engine
  // Controls Hamburger Menu open/close ('X' animation) and auto-plays all videos
  const runtimeScript = doc.createElement('script');
  runtimeScript.setAttribute('data-zippix', 'master-runtime-engine');
  runtimeScript.textContent = `
    (function() {
      // 1. Continuous HTML5 Video Auto-Play
      function playVideos() {
        document.querySelectorAll('video').forEach(function(v) {
          v.muted = true;
          v.playsInline = true;
          var p = v.play();
          if (p && p.catch) { p.catch(function() {}); }
        });
      }
      window.addEventListener('DOMContentLoaded', playVideos);
      window.addEventListener('click', playVideos, { once: true });
      window.addEventListener('scroll', playVideos, { once: true });
      window.addEventListener('mousemove', playVideos, { once: true });

      // 2. Interactive Hamburger Menu Engine
      window.addEventListener('DOMContentLoaded', function() {
        var menuButtons = Array.from(document.querySelectorAll(
          'button[aria-label*="menu" i], button[aria-label*="Open" i], button:has(.border-current), [class*="hamburger"], [class*="menu-btn"], [class*="nav-toggle"]'
        ));

        if (menuButtons.length === 0) {
          document.querySelectorAll('button').forEach(function(btn) {
            if (btn.querySelectorAll('div, span').length >= 2 && btn.clientWidth <= 64) {
              menuButtons.push(btn);
            }
          });
        }

        var menuDrawers = Array.from(document.querySelectorAll(
          'nav[class*="shadow-menu"], nav.transition-transfrom-opacity, div[role="menu"], [class*="drawer"], [class*="mobile-menu"], [class*="nav-menu"], [class*="nav-dialog"]'
        ));

        var isOpen = false;

        function toggleMenu(forceOpen) {
          isOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

          menuButtons.forEach(function(btn) {
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            var bars = btn.querySelectorAll('div, span');
            if (bars.length >= 3) {
              if (isOpen) {
                bars[0].style.setProperty('transform', 'translate(-50%, -50%) rotate(45deg)', 'important');
                bars[0].style.setProperty('transition', 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 'important');
                bars[1].style.setProperty('opacity', '0', 'important');
                bars[1].style.setProperty('transition', 'opacity 0.2s ease', 'important');
                bars[2].style.setProperty('transform', 'translate(-50%, -50%) rotate(-45deg)', 'important');
                bars[2].style.setProperty('transition', 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 'important');
              } else {
                bars[0].style.setProperty('transform', 'translate(-50%, -50%) translateY(-0.8rem)', 'important');
                bars[1].style.setProperty('opacity', '1', 'important');
                bars[2].style.setProperty('transform', 'translate(-50%, -50%) translateY(0.8rem)', 'important');
              }
            }
          });

          menuDrawers.forEach(function(drawer) {
            if (isOpen) {
              drawer.style.setProperty('opacity', '1', 'important');
              drawer.style.setProperty('visibility', 'visible', 'important');
              drawer.style.setProperty('pointer-events', 'auto', 'important');
              drawer.style.setProperty('transform', 'scale(1)', 'important');
              drawer.style.setProperty('display', 'flex', 'important');
              drawer.style.setProperty('z-index', '999999', 'important');
              drawer.setAttribute('aria-hidden', 'false');
              drawer.classList.remove('opacity-0', 'pointer-events-none', 'scale-25', 'scale-95');
              drawer.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');

              drawer.querySelectorAll('div[class*="transition-transform"], li').forEach(function(item) {
                item.style.setProperty('opacity', '1', 'important');
                item.style.setProperty('transform', 'none', 'important');
                item.style.setProperty('pointer-events', 'auto', 'important');
              });
            } else {
              drawer.style.setProperty('opacity', '0', 'important');
              drawer.style.setProperty('pointer-events', 'none', 'important');
              drawer.style.setProperty('transform', 'scale(0.25)', 'important');
              drawer.setAttribute('aria-hidden', 'true');
              drawer.classList.add('opacity-0', 'pointer-events-none');
              drawer.classList.remove('opacity-100', 'pointer-events-auto');
            }
          });
        }

        menuButtons.forEach(function(btn) {
          btn.style.setProperty('cursor', 'pointer', 'important');
          btn.style.setProperty('pointer-events', 'auto', 'important');
          btn.style.setProperty('z-index', '999999', 'important');
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
          });
        });

        window.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && isOpen) toggleMenu(false);
        });

        document.addEventListener('click', function(e) {
          if (isOpen) {
            var inside =
              menuDrawers.some(function(d) {
                return d.contains(e.target);
              }) ||
              menuButtons.some(function(b) {
                return b.contains(e.target);
              });
            if (!inside) toggleMenu(false);
          }
        });
      });

      // 3. Scroll Reveal Observer for Viewport Items
      window.addEventListener('DOMContentLoaded', function() {
        var elements = document.querySelectorAll(
          '[class*="opacity-0"]:not([role="menu"]):not(nav[class*="shadow-menu"]):not(header), [class*="translate-y-"], [data-scroll]'
        );
        if ('IntersectionObserver' in window) {
          var obs = new IntersectionObserver(
            function(entries) {
              entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                  var el = entry.target;
                  el.style.setProperty('opacity', '1', 'important');
                  el.style.setProperty('transform', 'none', 'important');
                  el.style.setProperty('visibility', 'visible', 'important');
                  el.style.transition =
                    'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                  obs.unobserve(el);
                }
              });
            },
            { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
          );
          elements.forEach(function(el) {
            obs.observe(el);
          });
        } else {
          elements.forEach(function(el) {
            el.style.setProperty('opacity', '1', 'important');
          });
        }
      });
    })();
  `;
  head.appendChild(runtimeScript);

  // 12. Generate Output Files
  const cleanHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
  const siteName = (
    document.title ? document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'website'
  )
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'website-clone';

  const zip = new JSZip();
  const folder = zip.folder(siteName) || zip;
  folder.file('index.html', cleanHtml);
  folder.file('styles.css', masterCss);

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return {
    html: cleanHtml,
    css: masterCss,
    siteName,
    zipBlob,
  };
}

/**
 * Downloads the full-page clone package as a Woblo-style .zip containing:
 * <siteName>/index.html
 * <siteName>/styles.css
 */
export async function downloadPageAsZip(options?: CloneOptions): Promise<void> {
  const { siteName, zipBlob } = await generateClonedPackage(options);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zipBlob);
  a.download = `${siteName}.full-page.Zippix.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Downloads a standalone index.html with styles inlined (single double-clickable file)
 */
export async function downloadPageAsHtml(options?: CloneOptions): Promise<void> {
  const { html, css, siteName } = await generateClonedPackage(options);
  let inlinedHtml = html;
  const styleBlock = `<style data-zippix="master-styles">\n${css}\n</style>`;
  if (inlinedHtml.includes('<link rel="stylesheet" href="styles.css">')) {
    inlinedHtml = inlinedHtml.replace('<link rel="stylesheet" href="styles.css">', styleBlock);
  } else if (inlinedHtml.includes('</head>')) {
    inlinedHtml = inlinedHtml.replace('</head>', `${styleBlock}\n</head>`);
  } else {
    inlinedHtml = `${styleBlock}\n${inlinedHtml}`;
  }

  const blob = new Blob([inlinedHtml], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${siteName}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
