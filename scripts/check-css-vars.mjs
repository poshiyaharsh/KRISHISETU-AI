import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendSrcDir = path.join(rootDir, 'frontend', 'src');
const tokensCssPath = path.join(frontendSrcDir, 'design', 'tokens.css');

if (!fs.existsSync(tokensCssPath)) {
  console.error(`Error: tokens.css not found at ${tokensCssPath}`);
  process.exit(1);
}

// 1. Extract definitions from tokens.css
const tokensCssContent = fs.readFileSync(tokensCssPath, 'utf8');
const globalTokens = new Set();
const defRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
let match;
while ((match = defRegex.exec(tokensCssContent)) !== null) {
  globalTokens.add(match[1]);
}

console.log(`Loaded ${globalTokens.size} CSS variables from tokens.css`);

// 2. Scan frontend/src files
const errors = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(css|tsx|ts|jsx|js|html)$/.test(entry.name)) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find local definitions in this file
  const localDefs = new Set();
  let localMatch;
  while ((localMatch = defRegex.exec(content)) !== null) {
    localDefs.add(localMatch[1]);
  }

  // Find all var(--...) usages
  const usageRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  const lines = content.split('\n');
  
  lines.forEach((line, lineIndex) => {
    let usageMatch;
    while ((usageMatch = usageRegex.exec(line)) !== null) {
      const varName = usageMatch[1];
      if (!globalTokens.has(varName) && !localDefs.has(varName)) {
        errors.push({
          file: path.relative(rootDir, filePath).replace(/\\/g, '/'),
          line: lineIndex + 1,
          varName,
          text: line.trim(),
        });
      }
    }
  });
}

scanDir(frontendSrcDir);

if (errors.length > 0) {
  console.error(`\n❌ Found ${errors.length} undefined CSS variable usages:`);
  for (const err of errors) {
    console.error(`  ${err.file}:${err.line} -> ${err.varName} (in: "${err.text}")`);
  }
  process.exit(1);
} else {
  console.log('✅ All CSS variables in frontend/src are valid and defined!');
  process.exit(0);
}
