import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'frontend', 'public');
const brandDocsDir = path.resolve(rootDir, 'docs', 'brand');

function renderSvgToPng(svgString, outputPath, options = {}) {
  const resvg = new Resvg(svgString, {
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'Noto Sans',
    },
    ...options,
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  fs.writeFileSync(outputPath, pngBuffer);
  return {
    width: pngData.width,
    height: pngData.height,
    size: pngBuffer.length,
  };
}

async function exportBrand() {
  console.log('--- KrishiSetu AI: Exporting Brand Assets ---');

  // 1. Favicon variants
  const faviconSvg = fs.readFileSync(path.join(publicDir, 'favicon.svg'), 'utf-8');

  // Favicon 32x32
  const fav32 = renderSvgToPng(faviconSvg, path.join(publicDir, 'favicon-32.png'), {
    fitTo: { mode: 'width', value: 32 },
  });
  console.log(`Exported favicon-32.png: ${fav32.width}x${fav32.height} (${fav32.size} bytes)`);

  // Favicon 192x192
  const fav192 = renderSvgToPng(faviconSvg, path.join(publicDir, 'favicon-192.png'), {
    fitTo: { mode: 'width', value: 192 },
  });
  console.log(`Exported favicon-192.png: ${fav192.width}x${fav192.height} (${fav192.size} bytes)`);

  // Favicon 512x512
  const fav512 = renderSvgToPng(faviconSvg, path.join(publicDir, 'favicon-512.png'), {
    fitTo: { mode: 'width', value: 512 },
  });
  console.log(`Exported favicon-512.png: ${fav512.width}x${fav512.height} (${fav512.size} bytes)`);

  // 2. Apple Touch Icon (180x180, solid paddy background, no transparency)
  // Apple automatically rounds corners; transparent corners render black on iOS.
  const appleTouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="#0F4A32"/>
  <g transform="translate(30, 30)">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 100A46 46 0 0 1 106 100" stroke="#F5F0DC" stroke-width="12"/>
      <path d="M8 100H112" stroke="#D9A93F" stroke-width="11"/>
      <path d="M60 100V46" stroke="#7BC47F" stroke-width="9"/>
    </g>
    <path d="M60 46C44 46 33 36 31 20C48 20 58 29 60 46Z" fill="#7BC47F"/>
    <path d="M60 46C76 46 87 36 89 20C72 20 62 29 60 46Z" fill="#7BC47F"/>
  </g>
</svg>`;

  const appleTouch = renderSvgToPng(appleTouchSvg, path.join(publicDir, 'apple-touch-icon.png'), {
    fitTo: { mode: 'width', value: 180 },
  });
  console.log(`Exported apple-touch-icon.png: ${appleTouch.width}x${appleTouch.height} (${appleTouch.size} bytes)`);

  // 3. Open Graph Image (1200x630, cream background, logo centered, tagline)
  const ogSvg = fs.readFileSync(path.join(brandDocsDir, 'og-image.svg'), 'utf-8');
  const ogImage = renderSvgToPng(ogSvg, path.join(publicDir, 'og-image.png'), {
    fitTo: { mode: 'width', value: 1200 },
  });
  console.log(`Exported og-image.png: ${ogImage.width}x${ogImage.height} (${ogImage.size} bytes)`);

  // 4. Web Manifest
  const manifest = {
    name: 'KrishiSetu AI',
    short_name: 'KrishiSetu',
    description: 'Multilingual AI agricultural advisory platform for Indian farmers',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F0DC',
    theme_color: '#0F4A32',
    icons: [
      {
        src: '/favicon-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };

  const manifestPath = path.join(publicDir, 'site.webmanifest');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`Written site.webmanifest to ${manifestPath}`);

  // Acceptance Check verification
  console.log('\n--- Acceptance Verification ---');
  const checks = [
    { name: 'favicon-32.png', w: 32, h: 32, actual: fav32 },
    { name: 'favicon-192.png', w: 192, h: 192, actual: fav192 },
    { name: 'favicon-512.png', w: 512, h: 512, actual: fav512 },
    { name: 'apple-touch-icon.png', w: 180, h: 180, actual: appleTouch },
    { name: 'og-image.png', w: 1200, h: 630, actual: ogImage },
  ];

  let allPassed = true;
  for (const c of checks) {
    if (c.actual.width === c.w && c.actual.height === c.h) {
      console.log(`[PASS] ${c.name}: ${c.actual.width}x${c.actual.height}`);
    } else {
      console.error(`[FAIL] ${c.name}: expected ${c.w}x${c.h}, got ${c.actual.width}x${c.actual.height}`);
      allPassed = false;
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
  console.log('\nAll brand export acceptance checks passed successfully!');
}

exportBrand().catch((err) => {
  console.error(err);
  process.exit(1);
});
