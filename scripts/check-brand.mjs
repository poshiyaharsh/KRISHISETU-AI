import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const allowedAssetsPath = path.resolve(rootDir, 'brand', 'allowed-assets.json');
const forbiddenHashesPath = path.resolve(rootDir, 'brand', 'forbidden-hashes.txt');

if (!fs.existsSync(allowedAssetsPath)) {
  console.error('[FAIL] brand/allowed-assets.json not found!');
  process.exit(1);
}

const allowedAssets = JSON.parse(fs.readFileSync(allowedAssetsPath, 'utf-8'));
const forbiddenContent = fs.existsSync(forbiddenHashesPath)
  ? fs.readFileSync(forbiddenHashesPath, 'utf-8')
  : '';
const forbiddenHashes = new Set(
  forbiddenContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/)[0].toLowerCase())
);

let errors = [];

function getSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toLowerCase();
}

// 1. Check all logo, icon, favicon files in frontend/public and frontend/src
function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name !== 'node_modules' && ent.name !== 'dist' && ent.name !== '.git') {
        scanDir(full);
      }
    } else if (ent.isFile()) {
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');
      const lower = ent.name.toLowerCase();
      const isBrandImage =
        (lower.includes('logo') || lower.includes('icon') || lower.includes('favicon')) &&
        (lower.endsWith('.svg') || lower.endsWith('.png') || lower.endsWith('.ico') || lower.endsWith('.jpg') || lower.endsWith('.webp'));

      if (isBrandImage) {
        const hash = getSha256(full);

        // Check if forbidden
        if (forbiddenHashes.has(hash)) {
          errors.push(`Forbidden asset detected: ${rel} matches forbidden hash ${hash}`);
        }

        // Check if allowed
        if (!allowedAssets[rel]) {
          errors.push(`Unrecognized brand asset: ${rel} is not in brand/allowed-assets.json`);
        } else if (allowedAssets[rel].toLowerCase() !== hash) {
          errors.push(`Hash mismatch for ${rel}: expected ${allowedAssets[rel]}, got ${hash}`);
        }
      }
    }
  }
}

scanDir(path.resolve(rootDir, 'frontend', 'public'));
scanDir(path.resolve(rootDir, 'frontend', 'src'));

// 2. Scan code for references to old or unauthorized brand paths
const codeFiles = [];
function findCodeFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name !== 'node_modules' && ent.name !== 'dist' && ent.name !== '.git' && ent.name !== 'coverage') {
        findCodeFiles(full);
      }
    } else if (ent.isFile() && (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts') || ent.name.endsWith('.html') || ent.name.endsWith('.mjs'))) {
      if (ent.name !== 'check-brand.mjs') {
        codeFiles.push(full);
      }
    }
  }
}

findCodeFiles(path.resolve(rootDir, 'frontend', 'src'));
codeFiles.push(path.resolve(rootDir, 'frontend', 'index.html'));

const forbiddenReferences = [
  'favicon.svg',
  'logo.png',
  'logo-icon.png',
  'logo.master.png',
  'logo.source.svg',
];

for (const file of codeFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(rootDir, file).replace(/\\/g, '/');
  for (const ref of forbiddenReferences) {
    if (content.includes(ref)) {
      errors.push(`Code reference to forbidden asset "${ref}" found in ${rel}`);
    }
  }
}

if (errors.length > 0) {
  console.error('--- Brand Asset Verification FAILED ---');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('--- Brand Asset Verification PASSED ---');
console.log(`Verified ${Object.keys(allowedAssets).length} allowed brand assets. No forbidden hashes or obsolete image references found.`);
