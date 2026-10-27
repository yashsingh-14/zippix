import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';
import type { ExtractedColor } from '../types';

extend([a11yPlugin, namesPlugin]);

export function parseColor(rawColor: string): ExtractedColor | null {
  if (!rawColor || rawColor === 'transparent' || rawColor === 'inherit' || rawColor === 'initial') {
    return null;
  }

  // Filter out rgba with zero or near-zero alpha
  if (rawColor.startsWith('rgba') && rawColor.includes(', 0)')) {
    return null;
  }

  const c = colord(rawColor);
  if (!c.isValid()) return null;
  if (c.alpha() < 0.05) return null; // Invisible color

  const hex = c.toHex().toUpperCase();
  const rgb = c.toRgbString();
  const hsl = c.toHslString();
  const brightness = c.brightness(); // 0 to 1
  const saturation = c.toHsl().s; // 0 to 100

  // Contrast against dark and light
  const contrastOnDark = Number(c.contrast('#0f172a').toFixed(2));
  const contrastOnLight = Number(c.contrast('#ffffff').toFixed(2));

  // Determine role/category
  let category: ExtractedColor['category'] = 'neutral';
  if (saturation < 12) {
    if (brightness > 0.88) {
      category = 'background';
    } else if (brightness < 0.25) {
      category = 'text';
    } else {
      category = 'neutral';
    }
  } else {
    if (saturation > 40 && brightness > 0.3 && brightness < 0.85) {
      category = 'primary';
    } else {
      category = 'accent';
    }
  }

  return {
    hex,
    rgb,
    hsl,
    category,
    contrastOnDark,
    contrastOnLight,
    isAccessibleOnDark: contrastOnDark >= 4.5,
    isAccessibleOnLight: contrastOnLight >= 4.5,
    count: 1,
  };
}

export function aggregateColors(rawColors: string[]): ExtractedColor[] {
  const map = new Map<string, ExtractedColor>();

  for (const raw of rawColors) {
    const parsed = parseColor(raw);
    if (!parsed) continue;

    const existing = map.get(parsed.hex);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(parsed.hex, parsed);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
