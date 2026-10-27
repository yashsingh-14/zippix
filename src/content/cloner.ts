/**
 * High-fidelity 1:1 Page and Component Cloner
 * Captures the exact DOM, stylesheets, fonts, and assets so downloaded HTML looks identical.
 */

export function cloneFullPageHtml(): string {
  const currentUrl = window.location.href;
  const origin = window.location.origin;

  // Clone document
  const docClone = document.documentElement.cloneNode(true) as HTMLElement;

  // 1. Remove Zippix inspector overlay
  docClone.querySelector('#zippix-inspector-root')?.remove();

  // 2. Remove script tags to prevent hydration crashes or local file redirects
  docClone.querySelectorAll('script').forEach((s) => s.remove());

  // 3. Ensure <base href="..."> is at the very top of <head>
  let head = docClone.querySelector('head');
  if (!head) {
    head = document.createElement('head');
    docClone.insertBefore(head, docClone.firstChild);
  }

  // Remove existing base tag if any
  head.querySelectorAll('base').forEach((b) => b.remove());

  const baseTag = document.createElement('base');
  baseTag.setAttribute('href', currentUrl);
  head.insertBefore(baseTag, head.firstChild);

  // 4. Resolve relative stylesheet links to absolute URLs
  docClone.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('data:')) {
      try {
        link.setAttribute('href', new URL(href, currentUrl).href);
      } catch (e) {}
    }
  });

  // 5. Resolve relative image sources
  docClone.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      try {
        img.setAttribute('src', new URL(src, currentUrl).href);
      } catch (e) {}
    }

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

  // 6. Inline all CSSOM stylesheet rules
  let inlinedStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            inlinedStyles += rule.cssText + '\n';
          }
        }
      } catch (e) {
        // Cross-origin stylesheet - link tag with absolute URL handles this
      }
    }
  } catch (e) {}

  if (inlinedStyles) {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-zippix', 'inlined-css');
    styleEl.textContent = inlinedStyles;
    head.appendChild(styleEl);
  }

  return `<!DOCTYPE html>\n` + docClone.outerHTML;
}

export function cloneComponentHtml(targetEl: HTMLElement): string {
  const currentUrl = window.location.href;
  const comp = window.getComputedStyle(targetEl);
  const bodyComp = window.getComputedStyle(document.body);

  // Clone element
  const clone = targetEl.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script').forEach((s) => s.remove());

  // Capture all page styles to preserve classes and animations
  let inlinedStyles = '';
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          for (const rule of Array.from(rules)) {
            inlinedStyles += rule.cssText + '\n';
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  // Gather stylesheet link tags
  const linksHtml = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => {
      const href = l.getAttribute('href');
      const abs = href ? new URL(href, currentUrl).href : '';
      return `<link rel="stylesheet" href="${abs}">`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Clone — ${targetEl.tagName.toLowerCase()}</title>
  <base href="${currentUrl}">
  ${linksHtml}
  <style>
    /* Reset & Viewport Stage */
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
    .zippix-component-container {
      max-width: 100%;
    }
    ${inlinedStyles}
  </style>
</head>
<body>
  <div class="zippix-component-container">
    ${clone.outerHTML}
  </div>
</body>
</html>`;
}
