import type { DesignTokens, InspectedElement } from '../types';

/**
 * Generate Tailwind CSS v3 configuration
 */
export function generateTailwindV3(tokens: DesignTokens): string {
  const colorMap: Record<string, string> = {};
  tokens.colors.slice(0, 15).forEach((c, index) => {
    const key = c.category === 'primary' && index === 0 ? 'brand' : `color-${index + 1}`;
    colorMap[key] = c.hex;
  });

  const fontMap: Record<string, string[]> = {};
  tokens.fonts.forEach((f, idx) => {
    const key = idx === 0 ? 'sans' : `font-${idx + 1}`;
    fontMap[key] = [f.family, 'sans-serif'];
  });

  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colorMap, null, 8).replace(/\n/g, '\n      ')},
      fontFamily: ${JSON.stringify(fontMap, null, 8).replace(/\n/g, '\n      ')},
      borderRadius: ${JSON.stringify(tokens.radii.slice(0, 6), null, 8).replace(/\n/g, '\n      ')}
    }
  }
};`;
}

/**
 * Generate Tailwind CSS v4 @theme directive
 */
export function generateTailwindV4(tokens: DesignTokens): string {
  let output = `@theme {\n`;

  // Colors
  output += `  /* Colors */\n`;
  tokens.colors.slice(0, 15).forEach((c, index) => {
    const name = c.category === 'primary' && index === 0 ? 'color-brand' : `color-${index + 1}`;
    output += `  --${name}: ${c.hex};\n`;
  });

  // Fonts
  if (tokens.fonts.length > 0) {
    output += `\n  /* Typography */\n`;
    tokens.fonts.forEach((f, idx) => {
      const name = idx === 0 ? 'font-sans' : `font-custom-${idx + 1}`;
      output += `  --${name}: '${f.family}', sans-serif;\n`;
    });
  }

  output += `}\n`;
  return output;
}

/**
 * Generate CSS Custom Properties (:root)
 */
export function generateCssVariables(tokens: DesignTokens): string {
  let css = `:root {\n`;
  css += `  /* Extracted from ${tokens.domain} */\n`;

  tokens.colors.slice(0, 20).forEach((c, idx) => {
    css += `  --color-${idx + 1}: ${c.hex}; /* ${c.category} */\n`;
  });

  tokens.fonts.forEach((f, idx) => {
    css += `  --font-family-${idx + 1}: '${f.family}';\n`;
  });

  tokens.shadows.slice(0, 5).forEach((s, idx) => {
    css += `  --shadow-${idx + 1}: ${s};\n`;
  });

  tokens.radii.slice(0, 5).forEach((r, idx) => {
    css += `  --radius-${idx + 1}: ${r};\n`;
  });

  css += `}\n`;
  return css;
}

/**
 * Generate W3C Standard Design Tokens JSON
 */
export function generateDesignTokensJson(tokens: DesignTokens): string {
  const result = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    color: {} as Record<string, any>,
    typography: {} as Record<string, any>,
    elevation: {} as Record<string, any>,
  };

  tokens.colors.forEach((c, idx) => {
    result.color[`color-${idx + 1}`] = {
      $value: c.hex,
      $type: 'color',
      $description: `Category: ${c.category}, Usage count: ${c.count}`,
    };
  });

  tokens.fonts.forEach((f, idx) => {
    result.typography[`font-${idx + 1}`] = {
      $value: f.family,
      $type: 'fontFamily',
      weights: f.weights,
    };
  });

  tokens.shadows.forEach((s, idx) => {
    result.elevation[`shadow-${idx + 1}`] = {
      $value: s,
      $type: 'shadow',
    };
  });

  return JSON.stringify(result, null, 2);
}

/**
 * Generate High-fidelity AI Prompt for Claude/ChatGPT/Cursor
 */
export function generateAiPrompt(element: InspectedElement, tokens?: DesignTokens): string {
  return `You are a Senior Frontend Engineer. Recreate the following UI element in modern React with TypeScript and Tailwind CSS.

### Target Element Specification
- **HTML Tag**: <${element.tagName.toLowerCase()}>
- **CSS Classes**: ${element.classList.join(' ') || 'None'}
- **Dimensions**: ${element.boxModel.width}px x ${element.boxModel.height}px
- **Key Styles**:
  - Color: ${element.computedStyles.color}
  - Background: ${element.computedStyles.backgroundColor}
  - Font: ${element.computedStyles.fontFamily} (${element.computedStyles.fontSize}, weight ${element.computedStyles.fontWeight})
  - Border Radius: ${element.computedStyles.borderRadius}
  - Box Shadow: ${element.computedStyles.boxShadow}

### Approximate Tailwind Classes
\`\`\`
${element.tailwindGuess}
\`\`\`

### Raw Clean HTML
\`\`\`html
${element.cleanHtml}
\`\`\`

${
  tokens
    ? `### Primary Color Palette Context
- Primary: ${tokens.colors[0]?.hex || '#3b82f6'}
- Background: ${tokens.colors.find((c) => c.category === 'background')?.hex || '#ffffff'}
- Text: ${tokens.colors.find((c) => c.category === 'text')?.hex || '#111827'}`
    : ''
}

### Instructions
1. Output production-ready, self-contained React component code.
2. Use modern Lucide-react icons where appropriate.
3. Ensure accessibility (ARIA attributes, semantic tags).
4. Match the exact visual hierarchy, spacing, and hover/active states.`;
}
