import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendSrcDir = path.join(rootDir, 'frontend', 'src');

const ALLOWED_NAMED_Z = new Set([
  'var(--ks-z-base)',
  'var(--ks-z-sticky)',
  'var(--ks-z-header)',
  'var(--ks-z-bottomnav)',
  'var(--ks-z-launcher)',
  'var(--ks-z-drawer)',
  'var(--ks-z-modal)',
  'var(--ks-z-toast)',
]);

// Tailwind allowed z-index classes mapping to named tokens
const ALLOWED_Z_CLASSES = new Set([
  'z-base',
  'z-sticky',
  'z-header',
  'z-bottomnav',
  'z-launcher',
  'z-drawer',
  'z-modal',
  'z-toast',
  'z-auto',
  'z-0',
]);

const errors = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(css|tsx|ts|jsx|js)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  // Allow tokens definition files
  if (filePath.endsWith('tokens.css') || filePath.endsWith('tokens.ts')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // 1. Raw CSS z-index: <number>
    const rawCssMatch = /z-index:\s*([0-9]+)/.exec(line);
    if (rawCssMatch) {
      errors.push({
        file: path.relative(rootDir, filePath).replace(/\\/g, '/'),
        line: index + 1,
        code: line.trim(),
        reason: `Arbitrary z-index '${rawCssMatch[1]}' found. Use named token var(--ks-z-*) instead.`,
      });
    }

    // 2. Arbitrary tailwind class like z-10, z-20, z-30, z-40, z-50, z-[...]
    const twMatch = /\bz-(10|20|30|40|50|\[\d+\])\b/.exec(line);
    if (twMatch) {
      errors.push({
        file: path.relative(rootDir, filePath).replace(/\\/g, '/'),
        line: index + 1,
        code: line.trim(),
        reason: `Arbitrary Tailwind class '${twMatch[0]}' found. Use named class (z-header, z-modal, etc.) or var(--ks-z-*).`,
      });
    }
  });
}

scanDir(frontendSrcDir);

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} arbitrary z-index violations:`);
  for (const err of errors) {
    console.error(`  ${err.file}:${err.line} -> ${err.reason} (in: "${err.code}")`);
  }
  process.exit(1);
} else {
  console.log('✅ Z-index scale check passed: All elements use the named z-index tokens.');
  process.exit(0);
}
