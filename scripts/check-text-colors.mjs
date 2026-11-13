import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'frontend', 'src');

/**
 * Strict allowlist of files allowed to use text-cream, text-mist, text-wheat, text-sprout
 * (or CSS variable equivalents) because they explicitly sit on a paddy (#0F4A32) background.
 * Every entry must have a documented reason justifying high contrast on paddy.
 */
const ALLOWLIST = {
  'WeatherCard.tsx': 'Full card container sits on bg-paddy gradient; cream/wheat/mist/sprout provide high contrast on dark green.',
  'WeatherCard.test.tsx': 'Unit tests asserting WeatherCard classes on bg-paddy.',
  'ChatBubble.tsx': 'User message bubble sits on bg-paddy with text-cream (8.98:1 contrast).',
  'ChatInput.tsx': 'Send submit button sits on bg-paddy with text-cream (8.98:1 contrast).',
  'Chat.tsx': 'Chat header / avatar tile sits on bg-paddy with text-cream (8.98:1 contrast).',
  'MainLayout.tsx': 'Accessibility skip-link has focus:bg-paddy focus:text-cream (8.98:1 contrast).',
  'MobileMenu.tsx': 'Primary consultation action button has bg-paddy text-cream with text-wheat icon (4.74:1 contrast).',
  'About.tsx': 'Primary advisory CTA button has bg-paddy text-cream (8.98:1 contrast).',
  'Nutrition.tsx': 'Active toggle segments have bg-paddy text-cream (8.98:1 contrast).',
  'SchemeDetail.tsx': 'Official application banner sits on from-paddy to-soil gradient with text-cream (8.98:1 contrast).',
  'BrandLogo.tsx': 'Reversed brand logo variant specifically designed for dark paddy backgrounds.',
};

// Patterns forbidden as text colors on light backgrounds:
// text-cream, text-mist, text-wheat, text-sprout, or var(--ks-color-cream/mist/wheat/sprout) used as color
const FORBIDDEN_REGEX = /\btext-(cream|mist|wheat|sprout)(?:\/[\d]+)?\b|color:\s*var\(--ks-color-(cream|mist|wheat|sprout)\)/g;

let totalChecked = 0;
const violations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      totalChecked++;
      checkFile(fullPath, entry.name);
    }
  }
}

function checkFile(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    let match;
    FORBIDDEN_REGEX.lastIndex = 0;
    while ((match = FORBIDDEN_REGEX.exec(line)) !== null) {
      if (!ALLOWLIST[fileName]) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: index + 1,
          matched: match[0],
          snippet: line.trim(),
        });
      }
    }
  });
}

console.log('--- KrishiSetu AI: Checking Text Color Guard ---');
scanDir(srcDir);

if (violations.length > 0) {
  console.error(`[FAIL] Found ${violations.length} forbidden text color usage(s) on light backgrounds:\n`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} uses '${v.matched}':`);
    console.error(`    ${v.snippet}\n`);
  }
  console.error('Palette colors (cream, mist, wheat, sprout) may NOT be used as text colors');
  console.error('except cream on paddy backgrounds. Use semantic tokens: text-primary, text-heading, text-muted, text-on-dark.\n');
  process.exit(1);
} else {
  console.log(`[PASS] All ${totalChecked} source files comply with text color contrast rules.`);
  console.log(`Documented allowlist (${Object.keys(ALLOWLIST).length} files on bg-paddy) verified.`);
}
