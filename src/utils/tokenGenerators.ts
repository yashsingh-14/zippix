import type { DesignTokens, InspectedElement } from '../types';

/**
 * Generate Standalone Live HTML + CSS File
 * Double-clicking this file opens directly in Chrome with full styles & preview!
 */
export function generateStandaloneHtml(tokens: DesignTokens, element?: InspectedElement | null): string {
  const fontLinks = tokens.fonts
    .filter((f) => f.source !== 'system' && f.family.length > 2)
    .slice(0, 3)
    .map((f) => {
      const formatted = encodeURIComponent(f.family);
      return `    <link href="https://fonts.googleapis.com/css2?family=${formatted}:wght@400;500;600;700&display=swap" rel="stylesheet">`;
    })
    .join('\n');

  const cssVars = generateCssVariables(tokens);

  const colorsHtml = tokens.colors
    .slice(0, 18)
    .map(
      (c) => `
        <div class="color-chip" onclick="copyText('${c.hex}')" title="Click to copy ${c.hex}">
          <div class="swatch" style="background-color: ${c.hex};"></div>
          <div class="chip-info">
            <span class="hex">${c.hex}</span>
            <span class="category">${c.category}</span>
          </div>
        </div>`
    )
    .join('');

  const fontsHtml = tokens.fonts
    .slice(0, 4)
    .map(
      (f) => `
        <div class="font-specimen">
          <div class="font-meta"><strong>${f.family}</strong> (${f.source}) • Used ${f.usageCount} times</div>
          <div class="font-sample" style="font-family: '${f.family}', sans-serif;">
            The quick brown fox jumps over the lazy dog. 1234567890
          </div>
        </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tokens.title || tokens.domain} — Extracted Design & Code</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
  <style>
    /* CSS Variables extracted from ${tokens.domain} */
${cssVars}

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: #0b0f19;
      color: #f1f5f9;
      font-family: ${tokens.fonts[0] ? `'${tokens.fonts[0].family}', ` : ''}-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.6;
      padding: 40px 20px;
    }

    .container {
      max-width: 1040px;
      margin: 0 auto;
    }

    header {
      margin-bottom: 36px;
      padding-bottom: 24px;
      border-bottom: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, #06b6d4, #6366f1);
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }

    .domain-url {
      color: #38bdf8;
      text-decoration: none;
      font-family: monospace;
      font-size: 14px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin: 32px 0 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #f8fafc;
    }

    .preview-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      position: relative;
    }

    .component-stage {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
      padding: 24px;
      background: #0f172a;
      border-radius: 10px;
      border: 1px dashed #334155;
    }

    .colors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 14px;
    }

    .color-chip {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.15s, border-color 0.15s;
    }

    .color-chip:hover {
      transform: translateY(-2px);
      border-color: #38bdf8;
    }

    .color-chip .swatch {
      height: 60px;
      width: 100%;
    }

    .chip-info {
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chip-info .hex {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      color: #f1f5f9;
    }

    .chip-info .category {
      font-size: 10px;
      color: #94a3b8;
      text-transform: capitalize;
    }

    .font-specimen {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 18px;
      margin-bottom: 14px;
    }

    .font-meta {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .font-sample {
      font-size: 18px;
      color: #f1f5f9;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #06b6d4;
      color: #0b0f19;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 8px;
      display: none;
      box-shadow: 0 10px 25px rgba(6,182,212,0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <div class="logo-badge">⚡ Zippix Export</div>
        <h1>${tokens.title || 'Design System & Components'}</h1>
        <a href="https://${tokens.domain}" target="_blank" class="domain-url">${tokens.domain}</a>
      </div>
      <div style="font-size: 12px; color: #64748b;">
        Extracted: ${new Date().toLocaleDateString()}
      </div>
    </header>

    ${
      element
        ? `
    <h2 class="section-title">🔍 Inspected Live Component</h2>
    <div class="preview-card">
      <div class="component-stage">
        ${element.cleanHtml}
      </div>
    </div>`
        : ''
    }

    <h2 class="section-title">🎨 Extracted Color Palette</h2>
    <div class="colors-grid">
      ${colorsHtml}
    </div>

    <h2 class="section-title">🔤 Typography Specimens</h2>
    <div>
      ${fontsHtml}
    </div>
  </div>

  <div id="toast" class="toast">Copied to clipboard!</div>

  <script>
    function copyText(text) {
      navigator.clipboard.writeText(text);
      const toast = document.getElementById('toast');
      toast.textContent = 'Copied ' + text;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 1500);
    }
  </script>
</body>
</html>`;
}

/**
 * Generate isolated component HTML + CSS (component.html)
 */
export function generateComponentHtml(element: InspectedElement, tokens?: DesignTokens): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview — ${element.tagName.toLowerCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .preview-canvas {
      padding: 40px;
      background: #1e293b;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      display: flex;
      justify-content: center;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="preview-canvas">
    ${element.cleanHtml}
  </div>
</body>
</html>`;
}

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
