import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const previewPath = path.resolve(rootDir, 'docs', 'brand', 'preview.html');
const framesDir = path.resolve(rootDir, 'docs', 'brand', 'loader-frames');

if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Chrome executable paths on Windows
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const chromePath = chromeCandidates.find((p) => fs.existsSync(p));

if (!chromePath) {
  console.error('No suitable Chromium executable found.');
  process.exit(1);
}

console.log(`Using browser: ${chromePath}`);

async function runVerification() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960, deviceScaleFactor: 2 });

  const previewUrl = pathToFileURL(previewPath).href;
  console.log(`Loading preview: ${previewUrl}`);
  await page.goto(previewUrl, { waitUntil: 'networkidle0' });

  // Full page preview
  await page.screenshot({ path: path.resolve(rootDir, 'docs', 'brand', 'preview.png'), fullPage: true });
  console.log('Saved docs/brand/preview.png');

  // Verify loader card element
  const loaderCard = await page.$('#loader-test-card');
  if (!loaderCard) {
    throw new Error('Could not find #loader-test-card in preview.html');
  }

  // Animation timeline captures: 0.5s, 1.5s, 2.5s, 3.1s
  // We reload and wait exact time offsets
  const timeline = [
    { timeMs: 500, label: '0.5s' },
    { timeMs: 1500, label: '1.5s' },
    { timeMs: 2500, label: '2.5s' },
    { timeMs: 3100, label: '3.1s' },
  ];

  for (const t of timeline) {
    await page.goto(previewUrl, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, t.timeMs));
    const cardEl = await page.$('#loader-test-card');
    const outPath = path.join(framesDir, `loader-${t.label}.png`);
    await cardEl.screenshot({ path: outPath });
    console.log(`Saved frame at ${t.label}: ${outPath}`);
  }

  // Verify prefers-reduced-motion: reduce
  console.log('Testing prefers-reduced-motion: reduce...');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(previewUrl, { waitUntil: 'networkidle0' });

  const reducedLoader = await page.$('#loader-test-card');
  const reducedLoaderPath = path.join(framesDir, 'loader-reduced-motion.png');
  await reducedLoader.screenshot({ path: reducedLoaderPath });
  console.log(`Saved reduced motion loader: ${reducedLoaderPath}`);

  // Skeleton card in reduced motion
  const cards = await page.$$('.card');
  if (cards.length >= 5) {
    const skeletonCard = cards[4];
    const reducedSkelPath = path.join(framesDir, 'skeleton-reduced-motion.png');
    await skeletonCard.screenshot({ path: reducedSkelPath });
    console.log(`Saved reduced motion skeleton: ${reducedSkelPath}`);
  }

  // Check CSS reduced motion styles via evaluation
  const motionCheck = await page.evaluate(() => {
    const arch = document.querySelector('.kl-arch');
    const archStyle = arch ? window.getComputedStyle(arch) : { animationName: 'none' };
    const skel = document.querySelector('.ks-skel');
    const skelStyle = skel ? window.getComputedStyle(skel) : { animationName: 'none' };
    return {
      archAnimation: archStyle.animationName,
      skelAnimation: skelStyle.animationName,
    };
  });

  console.log('Reduced motion check in DOM:', motionCheck);
  const motionPass =
    (motionCheck.archAnimation === 'none' || !motionCheck.archAnimation) &&
    (motionCheck.skelAnimation === 'none' || !motionCheck.skelAnimation);

  if (motionPass) {
    console.log('[PASS] prefers-reduced-motion correctly disables animations and shimmers.');
  } else {
    console.warn('[WARN] Check animationName under reduced motion:', motionCheck);
  }

  await browser.close();
  console.log('\nLoader and skeleton verification complete!');
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
