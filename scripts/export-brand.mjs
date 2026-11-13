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
  if (outputPath) {
    fs.writeFileSync(outputPath, pngBuffer);
  }
  return {
    width: pngData.width,
    height: pngData.height,
    size: pngBuffer.length,
    buffer: pngBuffer,
  };
}

function createIco(pngFrames) {
  const count = pngFrames.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO image type (1)
  header.writeUInt16LE(count, 4); // number of images

  let offset = 6 + count * 16;
  for (let i = 0; i < count; i++) {
    const { width, height, buffer } = pngFrames[i];
    const entryOffset = 6 + i * 16;
    header.writeUInt8(width >= 256 ? 0 : width, entryOffset);
    header.writeUInt8(height >= 256 ? 0 : height, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2); // color palette count
    header.writeUInt8(0, entryOffset + 3); // reserved
    header.writeUInt16LE(1, entryOffset + 4); // color planes
    header.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    header.writeUInt32LE(buffer.length, entryOffset + 8); // image size
    header.writeUInt32LE(offset, entryOffset + 12); // image offset
    offset += buffer.length;
  }
  return Buffer.concat([header, ...pngFrames.map((p) => p.buffer)]);
}

async function exportBrand() {
  console.log('--- KrishiSetu AI: Exporting Single-Source Brand Assets ---');

  // Source final icon SVG
  const logoIconSvg = fs.readFileSync(path.join(publicDir, 'logo-icon.svg'), 'utf-8');

  // 1. Favicon 32x32
  const fav32 = renderSvgToPng(logoIconSvg, path.join(publicDir, 'favicon-32.png'), {
    fitTo: { mode: 'width', value: 32 },
  });
  console.log(`Exported favicon-32.png: ${fav32.width}x${fav32.height} (${fav32.size} bytes)`);

  // 2. Icon 192x192 (both icon-192.png and favicon-192.png)
  const icon192 = renderSvgToPng(logoIconSvg, path.join(publicDir, 'icon-192.png'), {
    fitTo: { mode: 'width', value: 192 },
  });
  fs.writeFileSync(path.join(publicDir, 'favicon-192.png'), icon192.buffer);
  console.log(`Exported icon-192.png and favicon-192.png: 192x192 (${icon192.size} bytes)`);

  // 3. Icon 512x512 (both icon-512.png and favicon-512.png)
  const icon512 = renderSvgToPng(logoIconSvg, path.join(publicDir, 'icon-512.png'), {
    fitTo: { mode: 'width', value: 512 },
  });
  fs.writeFileSync(path.join(publicDir, 'favicon-512.png'), icon512.buffer);
  console.log(`Exported icon-512.png and favicon-512.png: 512x512 (${icon512.size} bytes)`);

  // 4. Maskable 512x512 icon (with safe-zone padding and solid background)
  // W3C spec: safe zone is 80% diameter circle (409.6px). 320px logo is comfortably within 62.5%.
  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#0F4A32"/>
  <g transform="translate(96, 96) scale(2.66667)">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M30 65V100M45 56.5V100M75 56.5V100M90 65V100" stroke="#F5F0DC" stroke-width="2.5" opacity=".5"/>
      <path d="M14 100A46 46 0 0 1 106 100" stroke="#F5F0DC" stroke-width="7"/>
      <path d="M8 100H112" stroke="#D9A93F" stroke-width="7"/>
      <path d="M60 100V46" stroke="#7BC47F" stroke-width="5"/>
    </g>
    <path d="M60 46C44 46 33 36 31 20C48 20 58 29 60 46Z" fill="#7BC47F"/>
    <path d="M60 46C76 46 87 36 89 20C72 20 62 29 60 46Z" fill="#7BC47F"/>
  </g>
</svg>`;
  const iconMaskable = renderSvgToPng(maskableSvg, path.join(publicDir, 'icon-maskable-512.png'), {
    fitTo: { mode: 'width', value: 512 },
  });
  console.log(`Exported icon-maskable-512.png: ${iconMaskable.width}x${iconMaskable.height} (${iconMaskable.size} bytes)`);

  // 5. Apple Touch Icon (180x180, solid paddy background #0F4A32, no transparent corners)
  const appleTouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <rect width="180" height="180" fill="#0F4A32"/>
  <g transform="translate(30, 30)">
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M30 65V100M45 56.5V100M75 56.5V100M90 65V100" stroke="#F5F0DC" stroke-width="2.5" opacity=".5"/>
      <path d="M14 100A46 46 0 0 1 106 100" stroke="#F5F0DC" stroke-width="7"/>
      <path d="M8 100H112" stroke="#D9A93F" stroke-width="7"/>
      <path d="M60 100V46" stroke="#7BC47F" stroke-width="5"/>
    </g>
    <path d="M60 46C44 46 33 36 31 20C48 20 58 29 60 46Z" fill="#7BC47F"/>
    <path d="M60 46C76 46 87 36 89 20C72 20 62 29 60 46Z" fill="#7BC47F"/>
  </g>
</svg>`;
  const appleTouch = renderSvgToPng(appleTouchSvg, path.join(publicDir, 'apple-touch-icon.png'), {
    fitTo: { mode: 'width', value: 180 },
  });
  console.log(`Exported apple-touch-icon.png: ${appleTouch.width}x${appleTouch.height} (${appleTouch.size} bytes)`);

  // 6. Open Graph Image (1200x630)
  const ogSvg = fs.readFileSync(path.join(brandDocsDir, 'og-image.svg'), 'utf-8');
  const ogImage = renderSvgToPng(ogSvg, path.join(publicDir, 'og-image.png'), {
    fitTo: { mode: 'width', value: 1200 },
  });
  console.log(`Exported og-image.png: ${ogImage.width}x${ogImage.height} (${ogImage.size} bytes)`);

  // 7. Multi-size favicon.ico (16, 32, 48)
  const f16 = renderSvgToPng(logoIconSvg, null, { fitTo: { mode: 'width', value: 16 } });
  const f32 = renderSvgToPng(logoIconSvg, null, { fitTo: { mode: 'width', value: 32 } });
  const f48 = renderSvgToPng(logoIconSvg, null, { fitTo: { mode: 'width', value: 48 } });
  const icoBuffer = createIco([f16, f32, f48]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log(`Exported favicon.ico: [16, 32, 48] (${icoBuffer.length} bytes)`);

  // 8. Web Manifest
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
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo-icon.svg',
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
    { name: 'icon-192.png', w: 192, h: 192, actual: icon192 },
    { name: 'icon-512.png', w: 512, h: 512, actual: icon512 },
    { name: 'icon-maskable-512.png', w: 512, h: 512, actual: iconMaskable },
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

  if (!fs.existsSync(path.join(publicDir, 'favicon.ico'))) {
    console.error('[FAIL] favicon.ico does not exist');
    allPassed = false;
  } else {
    console.log('[PASS] favicon.ico generated');
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
