import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.resolve(rootDir, 'docs', 'quality', 'lighthouse');

fs.mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://localhost:4173';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Starting Vite preview server...');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: path.resolve(rootDir, 'frontend'),
    shell: true,
    stdio: 'ignore',
  });

  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      await wait(500);
    }
  }
  if (!ready) {
    preview.kill();
    throw new Error('Vite preview server failed to start');
  }

  const routes = [
    { name: 'home', path: '/' },
    { name: 'recommend', path: '/recommend' },
    { name: 'weather', path: '/weather' },
    { name: 'schemes', path: '/schemes' },
    { name: 'chat', path: '/chat' },
  ];

  const results = [];

  try {
    for (const route of routes) {
      const url = `${BASE_URL}${route.path}`;
      const jsonPath = path.join(outDir, `${route.name}.report.json`);
      console.log(`Running Lighthouse (mobile Slow 4G) on ${url}...`);

      execFileSync(
        'npx',
        [
          'lighthouse',
          `"${url}"`,
          '--output=json',
          `--output-path="${jsonPath}"`,
          '--only-categories=performance,accessibility,best-practices',
          '--form-factor=mobile',
          '--throttling-method=simulate',
          '--chrome-flags="--headless=new --no-sandbox --disable-gpu"',
          '--quiet',
        ],
        {
          cwd: rootDir,
          shell: true,
          env: { ...process.env, CHROME_PATH },
          stdio: 'inherit',
        }
      );

      const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const perf = Math.round((report.categories.performance?.score ?? 0) * 100);
      const a11y = Math.round((report.categories.accessibility?.score ?? 0) * 100);
      const bp = Math.round((report.categories['best-practices']?.score ?? 0) * 100);
      results.push({ name: route.name, path: route.path, perf, a11y, bp });
      console.log(`  ${route.name}: Performance=${perf}, Accessibility=${a11y}, BestPractices=${bp}`);
    }
  } finally {
    preview.kill();
  }

  const md = [
    '# Lighthouse Mobile Audit Summary (Phase 10 — T10.6)',
    '',
    '**Profile:** Mobile (Simulated Slow 4G), Headless Chrome, Vite Production Build',
    '**Targets:** Performance >= 85, Accessibility >= 95, Best Practices >= 95',
    '',
    '| Page | Route | Performance | Accessibility | Best Practices |',
    '|---|---|---|---|---|',
    ...results.map((r) => `| ${r.name} | \`${r.path}\` | ${r.perf} | ${r.a11y} | ${r.bp} |`),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(outDir, 'README.md'), md);
  console.log('Saved Lighthouse summary to docs/quality/lighthouse/README.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
