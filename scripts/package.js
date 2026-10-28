import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const releaseDir = path.resolve(rootDir, 'release');

async function createPackage() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory not found! Run npm run build first.');
    process.exit(1);
  }

  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  const zip = new JSZip();

  function addFolderToZip(folderPath, zipFolder) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        const subZip = zipFolder.folder(entry.name);
        addFolderToZip(fullPath, subZip);
      } else {
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, fileData);
      }
    }
  }

  console.log('📦 Packaging dist folder into Chrome Web Store ZIP...');
  addFolderToZip(distDir, zip);

  const manifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));
  const version = manifest.version || '1.0.0';
  const zipFileName = `zippix-extension-v${version}.zip`;
  const outPath = path.join(releaseDir, zipFileName);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  fs.writeFileSync(outPath, buffer);
  console.log(`✨ Successfully generated store package: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

createPackage().catch(err => {
  console.error('❌ Packaging failed:', err);
  process.exit(1);
});
