import type { DesignTokens, ExtractedFont } from '../types';
import { aggregateColors } from '../utils/colorUtils';
import { huntAssets } from './assetHunter';
import { cloneFullPageHtml } from './cloner';

export function scanPageDesignTokens(): DesignTokens {
  const rawColors: string[] = [];
  const fontMap = new Map<string, { weights: Set<string | number>; sizes: Set<string>; count: number }>();
  const shadows = new Set<string>();
  const radii = new Set<string>();

  // 1. Scan CSS Variables & Rules from document stylesheets (CSSOM)
  try {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule) {
            const style = rule.style;
            if (style.color) rawColors.push(style.color);
            if (style.backgroundColor) rawColors.push(style.backgroundColor);
            if (style.borderColor) rawColors.push(style.borderColor);
            if (style.boxShadow && style.boxShadow !== 'none') shadows.add(style.boxShadow);
            if (style.borderRadius && style.borderRadius !== '0px') radii.add(style.borderRadius);
          }
        }
      } catch (e) {
        // Cross-origin stylesheet access restricted by browser policy; continue safely
      }
    }
  } catch (e) {
    // Continue
  }

  // 2. Smart sample visible DOM elements using TreeWalker
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        const el = node as HTMLElement;
        if (el.id === 'zippix-inspector-root' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let nodeCount = 0;
  const MAX_SAMPLES = 400; // Limit to 400 key elements for sub-second execution

  while (walker.nextNode() && nodeCount < MAX_SAMPLES) {
    const el = walker.currentNode as HTMLElement;
    nodeCount++;

    const comp = window.getComputedStyle(el);

    // Collect colors
    if (comp.color) rawColors.push(comp.color);
    if (comp.backgroundColor && comp.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      rawColors.push(comp.backgroundColor);
    }
    if (comp.borderColor && comp.borderColor !== 'rgba(0, 0, 0, 0)') {
      rawColors.push(comp.borderColor);
    }

    // Collect typography
    const family = comp.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    if (family) {
      if (!fontMap.has(family)) {
        fontMap.set(family, { weights: new Set(), sizes: new Set(), count: 0 });
      }
      const fontData = fontMap.get(family)!;
      fontData.weights.add(comp.fontWeight);
      fontData.sizes.add(comp.fontSize);
      fontData.count++;
    }

    // Collect effects
    if (comp.boxShadow && comp.boxShadow !== 'none') {
      shadows.add(comp.boxShadow);
    }
    if (comp.borderRadius && comp.borderRadius !== '0px') {
      radii.add(comp.borderRadius);
    }
  }

  // 3. Process colors
  const colors = aggregateColors(rawColors);

  // 4. Process fonts
  const fonts: ExtractedFont[] = Array.from(fontMap.entries())
    .map(([family, data]) => {
      const isSystem = ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif', 'serif', 'monospace'].includes(family);
      return {
        family,
        weights: Array.from(data.weights).sort(),
        sizes: Array.from(data.sizes).sort((a, b) => parseFloat(a) - parseFloat(b)),
        lineHeights: ['1.5'],
        source: isSystem ? 'system' : 'custom',
        usageCount: data.count,
      };
    })
    .sort((a, b) => b.usageCount - a.usageCount);

  // 5. Hunt assets
  const assets = huntAssets();

  return {
    domain: window.location.hostname || 'localhost',
    title: document.title || 'Webpage',
    colors,
    fonts,
    assets,
    shadows: Array.from(shadows).slice(0, 10),
    radii: Array.from(radii).slice(0, 10),
    extractedAt: new Date().toISOString(),
    fullPageHtml: cloneFullPageHtml(),
  };
}
