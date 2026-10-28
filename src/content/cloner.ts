/**
 * Zippix Master Cloner (Export Router)
 * Routes all cloning operations directly through the Woblo-grade fidelity engine.
 */

export {
  generateClonedPackage,
  downloadPageAsZip,
  downloadPageAsHtml,
  type CloneOptions,
} from './wobloCloner';

/**
 * Clones a single inspected element/component
 */
export function cloneComponentHtml(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style').forEach((s) => s.remove());
  return clone.outerHTML;
}

/**
 * Fast synchronous clone of the live rendered DOM without destructive computed style stamping.
 * Strips inspector overlays, Next.js hydration chunks, and prepares clean HTML.
 */
export function cloneFullPageHtml(): string {
  const currentUrl = window.location.href;
  const rawHtml = document.documentElement.outerHTML;
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');

  // Strip scroll-locking classes from <html> and <body>
  const scrollLockClasses = [
    'has-scroll-init',
    'has-scroll-smooth',
    'has-scroll-scrolling',
    'has-scroll-dragging',
    'lenis',
    'lenis-smooth',
    'lenis-stopped',
    'lenis-scrolling',
    'is-locked',
    'no-scroll',
    'overflow-hidden',
    'fp-enabled',
  ];
  scrollLockClasses.forEach((cls) => {
    doc.documentElement.classList.remove(cls);
    doc.body?.classList.remove(cls);
  });

  // Reset scroll containers
  doc.querySelectorAll('#main, [data-scroll-container]').forEach((container) => {
    (container as HTMLElement).style.removeProperty('transform');
    (container as HTMLElement).style.setProperty('position', 'relative', 'important');
    (container as HTMLElement).style.setProperty('min-height', '100vh', 'important');
    (container as HTMLElement).style.setProperty('width', '100%', 'important');
    (container as HTMLElement).removeAttribute('data-scroll-section-inview');
  });

  // 1. Remove inspector overlays
  doc.querySelector('#zippix-inspector-root')?.remove();
  doc.querySelectorAll('[data-zippix-overlay]').forEach((el) => el.remove());

  // 2. Remove full-page blocking loaders
  doc.querySelectorAll('.fixed.z-50.bg-dark-brown, [class*="loading-overlay"], #loader').forEach((el) => {
    el.remove();
  });

  // 3. Remove base tags
  doc.querySelectorAll('base').forEach((b) => b.remove());

  // 4. Clean up Next.js hydration scripts that crash on local file://
  doc.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src');
    if (src) {
      if (
        src.includes('/_next/static/chunks/') ||
        src.includes('turbopack') ||
        src.includes('webpack') ||
        src.includes('googletagmanager.com') ||
        src.includes('google-analytics.com')
      ) {
        s.remove();
        return;
      }
      try {
        s.setAttribute('src', new URL(src, currentUrl).href);
      } catch {}
    } else {
      const text = s.textContent || '';
      if (text.includes('__next_f') || text.includes('self.__next_f')) {
        s.remove();
      }
    }
  });

  // Remove Next.js chunk preloads
  doc.querySelectorAll('link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && (href.includes('/_next/static/chunks/') || href.includes('turbopack'))) {
      link.remove();
    }
  });

  // Ensure active video is unhidden
  const liveVideos = document.querySelectorAll('video');
  doc.querySelectorAll('video').forEach((clonedV, idx) => {
    const liveV = liveVideos[idx];
    const vSrc = (liveV && (liveV.currentSrc || liveV.src)) || clonedV.currentSrc || clonedV.src;
    if (vSrc && !vSrc.startsWith('data:') && !vSrc.startsWith('blob:')) {
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

    if (clonedV.id.includes('baklawa')) {
      clonedV.classList.remove('hidden', 'opacity-0');
      (clonedV as HTMLElement).style.removeProperty('display');
      (clonedV as HTMLElement).style.setProperty('opacity', '1', 'important');
    }
  });

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
