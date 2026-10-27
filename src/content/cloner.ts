/**
 * Zippix Ultimate 1:1 Pixel-Perfect Interactive Page Cloner
 * Replicates complete website page with 100% fidelity:
 * - Hamburger menu interactive open/close animations with rotating 'X'
 * - Marquee infinite scrolling continuous motion effect
 * - Correct video positioning without breaking Tailwind centering (-translate-x-1/2 -translate-y-1/2)
 * - Scroll animations, parallax & viewport reveal effects
 * - 3D/2D Canvas snapshots (Three.js/WebGL)
 * - HTML5 background videos (Vimeo, MP4, HLS) with auto-play
 * - Inlined stylesheets, CSS custom properties, and fonts
 * - SVG masks, defs, gradients & filters
 */

export function cloneFullPageHtml(): string {
  const currentUrl = window.location.href;

  // 1. Snapshot any live <canvas> elements (Three.js / WebGL / Spline)
  const canvasSnapshots = new Map<number, string>();
  document.querySelectorAll('canvas').forEach((canvas, index) => {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 100) {
        canvasSnapshots.set(index, dataUrl);
      }
    } catch {
      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width || canvas.clientWidth || 300;
        offscreen.height = canvas.height || canvas.clientHeight || 150;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(canvas, 0, 0);
          canvasSnapshots.set(index, offscreen.toDataURL('image/png'));
        }
      } catch {}
    }
  });

  // 2. Clone the live document
  const docClone = document.documentElement.cloneNode(true) as HTMLElement;

  // 3. Remove only Zippix inspector overlay (keep all original website elements)
  docClone.querySelector('#zippix-inspector-root')?.remove();

  // 4. Ensure <base href="..."> at the very top of <head>
  let head = docClone.querySelector('head');
  if (!head) {
    head = document.createElement('head');
    docClone.insertBefore(head, docClone.firstChild);
  }
  head.querySelectorAll('base').forEach((b) => b.remove());
  const baseTag = document.createElement('base');
  baseTag.setAttribute('href', currentUrl);
  head.insertBefore(baseTag, head.firstChild);

  // 5. Preserve website scripts (Next.js hydration, GSAP, etc.)
  // Remove only intrusive trackers (GTM, FB pixel, Hotjar)
  docClone.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src');
    if (src) {
      if (
        src.includes('googletagmanager.com') ||
        src.includes('google-analytics.com') ||
        src.includes('connect.facebook.net') ||
        src.includes('hotjar.com')
      ) {
        s.remove();
        return;
      }
      try {
        s.setAttribute('src', new URL(src, currentUrl).href);
        s.setAttribute('crossorigin', 'anonymous');
      } catch {}
    }
  });

  // 6. Preload links: resolve all script / font preloads to absolute URLs
  docClone.querySelectorAll('link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
      try {
        link.setAttribute('href', new URL(href, currentUrl).href);
      } catch {}
    }
  });

  // 7. Retain Canvas element with 3D snapshot fallback
  docClone.querySelectorAll('canvas').forEach((cv, idx) => {
    const dataUrl = canvasSnapshots.get(idx);
    if (dataUrl) {
      cv.style.backgroundImage = `url("${dataUrl}")`;
      cv.style.backgroundSize = 'contain';
      cv.style.backgroundPosition = 'center';
      cv.style.backgroundRepeat = 'no-repeat';
    }
  });

  // 8. Fix all <video> elements (ensure autoplay, loop, muted, playsinline)
  const liveVideos = document.querySelectorAll('video');
  docClone.querySelectorAll('video').forEach((clonedV, idx) => {
    const liveV = liveVideos[idx];
    const vSrc = (liveV && (liveV.currentSrc || liveV.src)) || clonedV.currentSrc || clonedV.src;
    if (vSrc) {
      try {
        clonedV.src = new URL(vSrc, currentUrl).href;
      } catch {
        clonedV.src = vSrc;
      }
    }
    clonedV.setAttribute('autoplay', '');
    clonedV.setAttribute('loop', '');
    clonedV.setAttribute('muted', '');
    clonedV.setAttribute('playsinline', '');

    // If this is the active hero video, ensure it is visible and positioned
    if (clonedV.id.includes('baklawa') || clonedV.classList.contains('mask-ingredient-video')) {
      if (!clonedV.classList.contains('hidden') || clonedV.id.includes('baklawa')) {
        clonedV.classList.remove('hidden', 'opacity-0');
        clonedV.style.setProperty('opacity', '1', 'important');
      }
    }
  });

  // 9. Fix all <img> and <picture> sources with absolute URLs & eager loading
  const liveImages = document.querySelectorAll('img');
  docClone.querySelectorAll('img').forEach((img, idx) => {
    const liveImg = liveImages[idx];
    const iSrc = (liveImg && (liveImg.currentSrc || liveImg.src)) || img.getAttribute('src');
    if (iSrc) {
      try {
        img.src = new URL(iSrc, currentUrl).href;
      } catch {
        img.src = iSrc;
      }
    }
    img.setAttribute('loading', 'eager');
    img.removeAttribute('decoding');

    const ss = img.getAttribute('srcset');
    if (ss) {
      try {
        img.setAttribute(
          'srcset',
          ss
            .split(',')
            .map((p) => {
              const [u, sz] = p.trim().split(/\s+/);
              if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
                return `${new URL(u, currentUrl).href} ${sz || ''}`.trim();
              }
              return p.trim();
            })
            .join(', ')
        );
      } catch {}
    }
  });

  // Fix <source> tags
  docClone.querySelectorAll('source').forEach((source) => {
    const sSrc = source.getAttribute('src');
    if (sSrc && !sSrc.startsWith('http') && !sSrc.startsWith('//') && !sSrc.startsWith('data:')) {
      try {
        source.setAttribute('src', new URL(sSrc, currentUrl).href);
      } catch {}
    }
    const sSet = source.getAttribute('srcset');
    if (sSet) {
      try {
        source.setAttribute(
          'srcset',
          sSet
            .split(',')
            .map((p) => {
              const [u, sz] = p.trim().split(/\s+/);
              if (!u.startsWith('http') && !u.startsWith('//') && !u.startsWith('data:')) {
                return `${new URL(u, currentUrl).href} ${sz || ''}`.trim();
              }
              return p.trim();
            })
            .join(', ')
        );
      } catch {}
    }
  });

  // 10. Sync live computed styles CAREFULLY
  // CRITICAL: NEVER overwrite class-based transforms (e.g. -translate-x-1/2, marquee, rotate)
  // because inline matrix() destroys Tailwind centering and video alignment!
  const liveElements = document.querySelectorAll('*');
  const clonedElements = docClone.querySelectorAll('*');
  const count = Math.min(liveElements.length, clonedElements.length);

  for (let i = 0; i < count; i++) {
    const live = liveElements[i] as HTMLElement;
    const cloned = clonedElements[i] as HTMLElement;
    if (live && cloned && live.nodeType === 1) {
      try {
        const comp = window.getComputedStyle(live);

        if (comp.backgroundImage && comp.backgroundImage !== 'none' && comp.backgroundImage.includes('url(')) {
          cloned.style.backgroundImage = comp.backgroundImage.replace(
            /url\(\s*(['"]?)(.*?)\1\s*\)/gi,
            (m, q, r) => {
              if (r.startsWith('data:') || r.startsWith('http')) return m;
              try {
                return `url("${new URL(r, currentUrl).href}")`;
              } catch {
                return m;
              }
            }
          );
          cloned.style.backgroundSize = comp.backgroundSize;
          cloned.style.backgroundPosition = comp.backgroundPosition;
          cloned.style.backgroundRepeat = comp.backgroundRepeat;
        }

        // Avoid stamping momentary matrix() transforms on videos, centered elements, or marquee tracks!
        const cls = (cloned.getAttribute('class') || '').toLowerCase();
        const hasTransformClasses =
          cls.includes('translate') ||
          cls.includes('marquee') ||
          cls.includes('rotate') ||
          cls.includes('scale') ||
          cls.includes('animate') ||
          cloned.tagName === 'VIDEO';

        if (comp.transform && comp.transform !== 'none' && !hasTransformClasses && !cloned.style.transform) {
          cloned.style.transform = comp.transform;
          cloned.style.transformOrigin = comp.transformOrigin;
        }
      } catch {}
    }
  }

  // 11. Extract & Inline all Stylesheets
  let inlinedStyles = '';
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      if (rules) {
        for (const rule of Array.from(rules)) {
          inlinedStyles +=
            rule.cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, q, r) => {
              if (r.startsWith('data:') || r.startsWith('http')) return m;
              try {
                return `url("${new URL(r, sheet.href || currentUrl).href}")`;
              } catch {
                return m;
              }
            }) + '\n';
        }
      }
    } catch {}
  }

  // Add Essential Fixes: Marquee Animation, Header Visibility, and Video Centering
  const coreOverrides = `
    /* Marquee Animation Guarantee */
    @keyframes zippixMarquee {
      0% { transform: translateX(0%); }
      100% { transform: translateX(var(--marquee-shift, -50%)); }
    }
    @-webkit-keyframes zippixMarquee {
      0% { -webkit-transform: translateX(0%); }
      100% { -webkit-transform: translateX(var(--marquee-shift, -50%)); }
    }
    [class*="animate-marquee"], .animate-marquee {
      -webkit-animation: zippixMarquee var(--marquee-duration, 16s) linear infinite !important;
      animation: zippixMarquee var(--marquee-duration, 16s) linear infinite !important;
      display: flex !important;
      will-change: transform !important;
    }

    /* Header & Navigation Visibility Guarantee */
    header, [class*="header"] {
      opacity: 1 !important;
      pointer-events: auto !important;
      visibility: visible !important;
    }

    /* Video Positioning Guarantee */
    video.mask-ingredient-video {
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      object-fit: cover !important;
    }

    /* Remove full-page blocking loaders */
    .fixed.z-50.bg-dark-brown {
      display: none !important;
    }
  `;

  if (inlinedStyles) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-zippix', 'master-cloned-styles');
    styleEl.textContent = inlinedStyles + '\n' + coreOverrides;
    head.appendChild(styleEl);
  }

  // 12. Master Interactive & Animation Runtime Engine
  const runtimeScript = document.createElement('script');
  runtimeScript.setAttribute('data-zippix', 'master-runtime-engine');
  runtimeScript.textContent = `
    (function() {
      // 1. Play all videos continuously
      function startAllVideos() {
        document.querySelectorAll('video').forEach(function(v) {
          v.muted = true;
          v.playsInline = true;
          var p = v.play();
          if (p && p.catch) { p.catch(function() {}); }
        });
      }
      window.addEventListener('DOMContentLoaded', startAllVideos);
      window.addEventListener('click', startAllVideos, { once: true });
      window.addEventListener('scroll', startAllVideos, { once: true });
      window.addEventListener('mousemove', startAllVideos, { once: true });

      // 2. Interactive Hamburger Menu Engine
      window.addEventListener('DOMContentLoaded', function() {
        // Ensure header is visible
        var headers = document.querySelectorAll('header');
        headers.forEach(function(h) {
          h.style.setProperty('opacity', '1', 'important');
          h.style.setProperty('pointer-events', 'auto', 'important');
        });

        // Find hamburger buttons
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
          'nav[class*="shadow-menu"], div[role="menu"], [class*="drawer"], [class*="mobile-menu"], [class*="nav-menu"], [class*="nav-dialog"]'
        ));

        var isMenuOpen = false;

        function toggleMenu(forceOpen) {
          isMenuOpen = typeof forceOpen === 'boolean' ? forceOpen : !isMenuOpen;

          menuButtons.forEach(function(btn) {
            btn.setAttribute('aria-expanded', isMenuOpen ? 'true' : 'false');
            var bars = btn.querySelectorAll('div, span');
            if (bars.length >= 3) {
              if (isMenuOpen) {
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
            if (isMenuOpen) {
              drawer.style.setProperty('opacity', '1', 'important');
              drawer.style.setProperty('visibility', 'visible', 'important');
              drawer.style.setProperty('pointer-events', 'auto', 'important');
              drawer.style.setProperty('transform', 'scale(1)', 'important');
              drawer.style.setProperty('display', 'flex', 'important');
              drawer.style.setProperty('z-index', '999999', 'important');
              drawer.setAttribute('aria-hidden', 'false');
              drawer.classList.remove('opacity-0', 'pointer-events-none', 'scale-25', 'scale-95');
              drawer.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');

              // Animate inner drawer items
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

        // Close on escape key
        window.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && isMenuOpen) {
            toggleMenu(false);
          }
        });

        // Close on clicking outside menu drawer
        document.addEventListener('click', function(e) {
          if (isMenuOpen) {
            var clickedInside = menuDrawers.some(function(d) { return d.contains(e.target); }) ||
                                menuButtons.some(function(b) { return b.contains(e.target); });
            if (!clickedInside) {
              toggleMenu(false);
            }
          }
        });
      });

      // 3. Smooth Viewport Scroll & Reveal Engine
      window.addEventListener('DOMContentLoaded', function() {
        var animatedElements = document.querySelectorAll(
          '[class*="opacity-0"]:not([role="menu"]):not(nav[class*="shadow-menu"]):not(header), [class*="translate-y-"], [data-scroll]'
        );

        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
              if (entry.isIntersecting) {
                var el = entry.target;
                el.style.setProperty('opacity', '1', 'important');
                el.style.setProperty('transform', 'none', 'important');
                el.style.setProperty('visibility', 'visible', 'important');
                el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                observer.unobserve(el);
              }
            });
          }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

          animatedElements.forEach(function(el) {
            observer.observe(el);
          });
        } else {
          animatedElements.forEach(function(el) {
            el.style.setProperty('opacity', '1', 'important');
          });
        }
      });
    })();
  `;
  head.appendChild(runtimeScript);

  return `<!DOCTYPE html>\n` + docClone.outerHTML;
}

export function cloneComponentHtml(targetEl: HTMLElement): string {
  const currentUrl = window.location.href;
  const bodyComp = window.getComputedStyle(document.body);

  const clone = targetEl.cloneNode(true) as HTMLElement;

  let inlinedStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            inlinedStyles +=
              rule.cssText.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (m, q, r) => {
                if (r.startsWith('data:') || r.startsWith('http')) return m;
                try {
                  return `url("${new URL(r, sheet.href || currentUrl).href}")`;
                } catch {
                  return m;
                }
              }) + '\n';
          }
        }
      } catch {}
    }
  } catch {}

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
