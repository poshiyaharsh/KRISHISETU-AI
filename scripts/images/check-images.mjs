import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const manifestPath = path.resolve(rootDir, 'frontend/public/img/manifest.json');
const creditsPath = path.resolve(rootDir, 'docs/brand/IMAGE_CREDITS.md');
const imgDir = path.resolve(rootDir, 'frontend/public/img');

console.log('🔍 Checking image manifest and credits registry...\n');

if (!fs.existsSync(manifestPath)) {
  console.error(`❌ Missing manifest file: ${manifestPath}`);
  console.error('Run: node scripts/images/optimize.mjs');
  process.exit(1);
}

if (!fs.existsSync(creditsPath)) {
  console.error(`❌ Missing credits file: ${creditsPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const creditsContent = fs.readFileSync(creditsPath, 'utf8');

const slotIds = Object.keys(manifest.slots || {});
if (slotIds.length === 0) {
  console.error('❌ Manifest has no slots defined.');
  process.exit(1);
}

let hasError = false;

for (const id of slotIds) {
  // 1. Verify slot is referenced in IMAGE_CREDITS.md
  if (!creditsContent.includes(`\`${id}\``)) {
    console.error(`❌ Slot "${id}" in manifest is NOT documented in docs/brand/IMAGE_CREDITS.md`);
    hasError = true;
  }

  const slot = manifest.slots[id];
  if (!slot.lqip || !slot.lqip.startsWith('data:image/')) {
    console.error(`❌ Slot "${id}" has missing or invalid LQIP placeholder`);
    hasError = true;
  }

  // 2. Verify all files exist on disk
  for (const w of slot.widths) {
    const files = slot.files[w];
    if (!files) {
      console.error(`❌ Slot "${id}" is missing files map for width ${w}`);
      hasError = true;
      continue;
    }

    for (const fmt of ['avif', 'webp', 'jpg']) {
      const fileMeta = files[fmt];
      if (!fileMeta || !fileMeta.file) {
        console.error(`❌ Slot "${id}" width ${w} missing format ${fmt}`);
        hasError = true;
        continue;
      }

      const filePath = path.resolve(imgDir, fileMeta.file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Image file missing on disk: ${fileMeta.file}`);
        hasError = true;
      }
    }
  }
}

if (hasError) {
  console.error('\n🚨 Image checks failed.');
  process.exit(1);
}

console.log(`✅ All ${slotIds.length} image slots verified against IMAGE_CREDITS.md and present on disk.`);
