import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const envDocPath = path.join(rootDir, 'docs', 'deploy', 'env.md');
const envExamplePath = path.join(rootDir, '.env.example');
const settingsDir = path.join(rootDir, 'backend', 'config', 'settings');
const frontendSrcDir = path.join(rootDir, 'frontend', 'src');

const envDoc = fs.readFileSync(envDocPath, 'utf8');
const envExample = fs.readFileSync(envExamplePath, 'utf8');

const foundVars = new Set(['DJANGO_SETTINGS_MODULE']);

// Scan backend/config/settings/*.py for env("VAR") / env.type("VAR")
for (const file of fs.readdirSync(settingsDir)) {
  if (!file.endsWith('.py')) continue;
  const content = fs.readFileSync(path.join(settingsDir, file), 'utf8');
  const regex = /env(?:\.\w+)?\(\s*["']([A-Z0-9_]+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    foundVars.add(match[1]);
  }
}

// Scan frontend/src for import.meta.env.VITE_*
function scanFrontend(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanFrontend(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const regex = /import\.meta\.env\.(VITE_[A-Z0-9_]+)/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        foundVars.add(match[1]);
      }
    }
  }
}
scanFrontend(frontendSrcDir);

const missing = [];
for (const varName of [...foundVars].sort()) {
  const inDoc = envDoc.includes(`\`${varName}\``);
  const inExample = new RegExp(`^${varName}=`, 'm').test(envExample);
  if (!inDoc || !inExample) {
    missing.push({ varName, inDoc, inExample });
  }
}

if (missing.length > 0) {
  console.error('❌ Environment variables missing from docs/deploy/env.md or .env.example:');
  for (const m of missing) {
    console.error(`  ${m.varName}: inDoc=${m.inDoc}, inExample=${m.inExample}`);
  }
  process.exit(1);
}

console.log(`✅ All ${foundVars.size} environment variables verified in docs/deploy/env.md and .env.example!`);
