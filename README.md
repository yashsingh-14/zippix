# Zippix ⚡
> The Ultimate Web Design System & Asset Inspector for Chrome (Manifest V3)

Extract design tokens, inspect live DOM elements, download visual assets (SVGs, WebP, images), and generate production-ready **Tailwind CSS**, **CSS Variables**, and **AI Component Prompts** (Claude / ChatGPT / Cursor) in one click.

---

## ✨ Features that make Zippix superior

| Feature | Description |
| :--- | :--- |
| **🚀 Chrome Side Panel API** | Docked persistent workspace that stays open alongside your browser tabs without closing on external clicks. |
| **🎨 Intelligent Color Vault** | Automatically groups detected colors into Primary, Background, Text, Accent, and Neutral. Includes real-time WCAG 2.1 AA/AAA accessibility contrast checks. |
| **🔤 Typography & Font Hierarchy** | Identifies Google Fonts, system fonts, weights (100–900), and font size scales with interactive live preview testing. |
| **🎯 Interactive Element Inspector** | Live hover bounding box with margin/padding indicators (DevTools fidelity) powered by Shadow DOM isolation so website styles never conflict. |
| **📦 Smart Asset Hunter & Bulk ZIP** | Deep scans inline `<svg>`, `<use>` sprite symbols, images, and CSS `background-image` properties. One-click "Download All (.ZIP)". |
| **⚡ 1-Click Code Exporters** | Export into **Tailwind v4 (`@theme`)**, **Tailwind v3 (`tailwind.config.js`)**, **CSS Custom Properties (`:root`)**, and **W3C Design Tokens JSON**. |
| **🤖 AI Prompt Synthesizer** | Converts inspected elements + computed styles into high-fidelity component reconstruction prompts ready for **Claude 3.7**, **ChatGPT**, **Cursor**, or **v0**. |

---

## 🛠️ Architecture & Tech Stack

- **Runtime Target**: Chrome Extension Manifest V3 (Future-proof Service Worker + Declarative APIs)
- **UI Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (Glassmorphic dark design system)
- **Icons**: Lucide React + Custom Prism layered geometric branding
- **Color Engine**: `colord` with WCAG A11y & color naming plugins
- **Asset Packaging**: `jszip` client-side archiver
- **Bundler**: Vite 8 with multi-entry compilation:
  - `sidepanel.html` & `popup.html` (SPA bundles)
  - `background.js` (ES Module Service Worker)
  - `content.js` (Isolated IIFE bundle guaranteeing zero CSP conflicts)

---

## 🚀 Quick Start & Installation

### 1. Build the Extension
```bash
# Clone or navigate to the directory
cd zippix

# Install dependencies (if not already installed)
npm install

# Build production bundle
npm run build
```

### 2. Load into Google Chrome / Brave / Edge
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** toggle in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `dist/` folder inside `zippix` (e.g. `C:\Users\rj\Desktop\zippix\dist` or `C:\Users\rj\Desktop\woblo-pro\dist`).
5. Zippix is now installed! Pin it to your toolbar and click its icon on any website.

---

## 📁 Repository Structure

```text
zippix/
├── dist/                      # Production unpacked extension ready for Chrome
│   ├── manifest.json          # Chrome Manifest V3 configuration
│   ├── background.js          # Service worker
│   ├── content.js             # Isolated IIFE content script
│   ├── sidepanel.html         # Persistent side panel UI
│   ├── popup.html             # Quick launcher popup
│   └── icons/                 # Crisp 16/48/128 PNG icons
├── src/
│   ├── background/            # Background service worker logic
│   ├── content/               # DOM tree-walker, asset hunter & element inspector
│   ├── sidepanel/             # Main React Dashboard UI
│   ├── popup/                 # Quick launcher component
│   ├── utils/                 # Color engine, SVG serializer, ZIP exporter, token generators
│   └── types/                 # Strict TypeScript schemas
├── scripts/
│   ├── build.js               # Multi-pass Vite build pipeline
│   └── generate-icons.js      # Pixel-perfect PNG icon generator
└── package.json
```

---

## 🛡️ Privacy & Performance

- **100% Local & Private**: No analytics, no tracking, no external server calls. All processing runs entirely on your machine.
- **Zero-Lag DOM Engine**: Uses optimized TreeWalker algorithms and CSSOM caching to scan pages in milliseconds without freezing heavy tabs.

---

## 📄 License

MIT License. Crafted with precision.
