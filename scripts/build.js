import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

async function buildAll() {
  console.log('🚀 Starting Zippix Build...\n');

  // Step 1: Clean dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  // Step 2: Build UI (SidePanel & Popup)
  console.log('📦 [1/3] Building SidePanel and Popup UI...');
  await build({
    root: rootDir,
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: {
          sidepanel: path.resolve(rootDir, 'sidepanel.html'),
          popup: path.resolve(rootDir, 'popup.html'),
        },
      },
    },
  });

  // Step 3: Build Background Service Worker (ES module)
  console.log('⚡ [2/3] Building Background Service Worker...');
  await build({
    root: rootDir,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/background/index.ts'),
        formats: ['es'],
        fileName: () => 'background.js',
      },
      rollupOptions: {
        output: {
          extend: false,
        },
      },
    },
  });

  // Step 4: Build Content Script (IIFE - standalone, zero runtime dependencies)
  console.log('🎯 [3/3] Building Content Script (IIFE)...');
  await build({
    root: rootDir,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve(rootDir, 'src/content/index.ts'),
        formats: ['iife'],
        name: 'WobloContentScript',
        fileName: () => 'content.js',
      },
      rollupOptions: {
        output: {
          extend: false,
        },
      },
    },
  });

  // Step 5: Copy manifest.json & icons
  console.log('📋 Copying manifest.json and icons to dist...');
  fs.copyFileSync(path.resolve(rootDir, 'public/manifest.json'), path.resolve(distDir, 'manifest.json'));
  fs.cpSync(path.resolve(rootDir, 'public/icons'), path.resolve(distDir, 'icons'), { recursive: true });

  console.log('\n✨ Build finished successfully! Distribution ready at: /dist');
}

buildAll().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
