import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const outDir = path.resolve(rootDir, 'frontend/public/img');
const rawDir = path.resolve(rootDir, 'scratch/raw-images');

// Enforce output directory
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

// Image Slot Definitions matching docs/brand/IMAGE_CREDITS.md
const SLOTS = [
  {
    id: 'hero-farmer-field',
    aspectRatio: '16/9',
    aspectRatioValue: 16 / 9,
    baseWidth: 1920,
    baseHeight: 1080,
    widths: [480, 768, 1280, 1920],
    budgetMaxKb: 120, // 120 KB max on mobile/tablet
    theme: {
      bgTop: '#F7EDE2',
      bgBottom: '#1B4D3E',
      accent: '#E6A817',
      label: 'Indian Farming Fields at Sunrise',
    },
  },
  {
    id: 'tile-crop-advice',
    aspectRatio: '1/1',
    aspectRatioValue: 1,
    baseWidth: 480,
    baseHeight: 480,
    widths: [320, 480],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#D8F3DC',
      bgBottom: '#2D6A4F',
      accent: '#52B788',
      label: 'Crop Advice & Soil Science',
    },
  },
  {
    id: 'tile-weather',
    aspectRatio: '1/1',
    aspectRatioValue: 1,
    baseWidth: 480,
    baseHeight: 480,
    widths: [320, 480],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#D0F0FD',
      bgBottom: '#1B4D3E',
      accent: '#0284C7',
      label: 'Monsoon Clouds & Rainfall',
    },
  },
  {
    id: 'tile-schemes',
    aspectRatio: '1/1',
    aspectRatioValue: 1,
    baseWidth: 480,
    baseHeight: 480,
    widths: [320, 480],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#FEF3C7',
      bgBottom: '#854D0E',
      accent: '#E6A817',
      label: 'Government Schemes & Subsidies',
    },
  },
  {
    id: 'tile-krishi-mitra',
    aspectRatio: '1/1',
    aspectRatioValue: 1,
    baseWidth: 480,
    baseHeight: 480,
    widths: [320, 480],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#E8F5E9',
      bgBottom: '#134E5E',
      accent: '#71B280',
      label: 'Krishi Mitra AI Assistant',
    },
  },
  {
    id: 'crop-rice',
    aspectRatio: '4/3',
    aspectRatioValue: 4 / 3,
    baseWidth: 640,
    baseHeight: 480,
    widths: [320, 480, 640],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#FEF9C3',
      bgBottom: '#1B4D3E',
      accent: '#CA8A04',
      label: 'Paddy Rice Crop',
    },
  },
  {
    id: 'crop-cotton',
    aspectRatio: '4/3',
    aspectRatioValue: 4 / 3,
    baseWidth: 640,
    baseHeight: 480,
    widths: [320, 480, 640],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#F8FAFC',
      bgBottom: '#1E293B',
      accent: '#94A3B8',
      label: 'White Cotton Plant',
    },
  },
  {
    id: 'crop-maize',
    aspectRatio: '4/3',
    aspectRatioValue: 4 / 3,
    baseWidth: 640,
    baseHeight: 480,
    widths: [320, 480, 640],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#FEF08A',
      bgBottom: '#166534',
      accent: '#EAB308',
      label: 'Golden Maize Corn',
    },
  },
  {
    id: 'crop-pomegranate',
    aspectRatio: '4/3',
    aspectRatioValue: 4 / 3,
    baseWidth: 640,
    baseHeight: 480,
    widths: [320, 480, 640],
    budgetMaxKb: 30,
    theme: {
      bgTop: '#FFE4E6',
      bgBottom: '#881337',
      accent: '#E11D48',
      label: 'Fresh Pomegranate',
    },
  },
  {
    id: 'state-empty-plots',
    aspectRatio: '16/9',
    aspectRatioValue: 16 / 9,
    baseWidth: 800,
    baseHeight: 450,
    widths: [480, 800],
    budgetMaxKb: 40,
    theme: {
      bgTop: '#F5EBE0',
      bgBottom: '#582F0E',
      accent: '#7F4F24',
      label: 'Fertile Agricultural Farmland',
    },
  },
];

// Helper to create an evocative vector scene for each slot
function createSlotSvg(slot) {
  const { baseWidth, baseHeight, theme } = slot;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${baseWidth}" height="${baseHeight}" viewBox="0 0 ${baseWidth} ${baseHeight}">
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${theme.bgTop}" />
          <stop offset="60%" stop-color="${theme.accent}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="${theme.bgBottom}" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.bgBottom}" />
          <stop offset="50%" stop-color="${theme.accent}" />
          <stop offset="100%" stop-color="${theme.bgBottom}" />
        </linearGradient>
      </defs>

      <!-- Background sky/field landscape -->
      <rect width="100%" height="100%" fill="url(#skyGrad)" />

      <!-- Stylized field contours -->
      <path d="M 0,${baseHeight * 0.65} Q ${baseWidth * 0.25},${baseHeight * 0.55} ${baseWidth * 0.5},${baseHeight * 0.62} T ${baseWidth},${baseHeight * 0.6} L ${baseWidth},${baseHeight} L 0,${baseHeight} Z" fill="url(#groundGrad)" opacity="0.85" />
      <path d="M 0,${baseHeight * 0.78} Q ${baseWidth * 0.3},${baseHeight * 0.72} ${baseWidth * 0.65},${baseHeight * 0.8} T ${baseWidth},${baseHeight * 0.75} L ${baseWidth},${baseHeight} L 0,${baseHeight} Z" fill="${theme.bgBottom}" />

      <!-- Sun or halo arc -->
      <circle cx="${baseWidth * 0.5}" cy="${baseHeight * 0.35}" r="${Math.min(baseWidth, baseHeight) * 0.18}" fill="${theme.accent}" opacity="0.3" />
      <circle cx="${baseWidth * 0.5}" cy="${baseHeight * 0.35}" r="${Math.min(baseWidth, baseHeight) * 0.1}" fill="#FFFFFF" opacity="0.4" />

      <!-- Center agricultural plant glyph -->
      <g transform="translate(${baseWidth * 0.5 - 30}, ${baseHeight * 0.68 - 40}) scale(${Math.min(baseWidth, baseHeight) / 500})">
        <path d="M 30,60 C 30,30 25,10 0,0 C 20,25 25,45 30,60 Z" fill="${theme.accent}" />
        <path d="M 30,60 C 30,30 35,10 60,0 C 40,25 35,45 30,60 Z" fill="${theme.bgTop}" />
        <line x1="30" y1="60" x2="30" y2="10" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.7" />
      </g>

      <!-- Artistic Vignette border -->
      <rect width="100%" height="100%" fill="none" stroke="${theme.bgBottom}" stroke-width="2" opacity="0.15" />
    </svg>
  `;
}

async function run() {
  console.log('🌾 KrishiSetu AI: Starting image optimization pipeline...\n');
  const manifest = {
    version: '2.0.0',
    generatedAt: new Date().toISOString(),
    slots: {},
  };

  let hasBudgetViolation = false;

  for (const slot of SLOTS) {
    const rawPathJpg = path.resolve(rawDir, `${slot.id}.jpg`);
    const rawPathPng = path.resolve(rawDir, `${slot.id}.png`);

    let inputBuffer;
    if (fs.existsSync(rawPathJpg)) {
      inputBuffer = fs.readFileSync(rawPathJpg);
    } else if (fs.existsSync(rawPathPng)) {
      inputBuffer = fs.readFileSync(rawPathPng);
    } else {
      // Generate clean vector source
      inputBuffer = Buffer.from(createSlotSvg(slot));
    }

    const slotManifest = {
      id: slot.id,
      aspectRatio: slot.aspectRatio,
      widths: slot.widths,
      formats: ['avif', 'webp', 'jpg'],
      files: {},
      lqip: '',
    };

    // 1. Generate Low-Quality Image Placeholder (LQIP, 24px wide blurred WebP base64)
    const lqipBuffer = await sharp(inputBuffer)
      .resize(24, Math.round(24 / slot.aspectRatioValue), { fit: 'cover' })
      .webp({ quality: 20 })
      .toBuffer();
    slotManifest.lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    // 2. Generate multi-resolution, multi-format images
    for (const w of slot.widths) {
      const h = Math.round(w / slot.aspectRatioValue);

      // AVIF (Modern primary)
      const avifFileName = `${slot.id}-${w}.avif`;
      const avifPath = path.resolve(outDir, avifFileName);
      await sharp(inputBuffer)
        .resize(w, h, { fit: 'cover' })
        .avif({ quality: 65, effort: 5 })
        .toFile(avifPath);
      const avifStat = fs.statSync(avifPath);

      // WebP (Universal secondary)
      const webpFileName = `${slot.id}-${w}.webp`;
      const webpPath = path.resolve(outDir, webpFileName);
      await sharp(inputBuffer)
        .resize(w, h, { fit: 'cover' })
        .webp({ quality: 75, effort: 4 })
        .toFile(webpPath);
      const webpStat = fs.statSync(webpPath);

      // Fallback JPEG
      const jpgFileName = `${slot.id}-${w}.jpg`;
      const jpgPath = path.resolve(outDir, jpgFileName);
      await sharp(inputBuffer)
        .resize(w, h, { fit: 'cover' })
        .jpeg({ quality: 80, progressive: true })
        .toFile(jpgPath);
      const jpgStat = fs.statSync(jpgPath);

      slotManifest.files[w] = {
        avif: { file: avifFileName, bytes: avifStat.size },
        webp: { file: webpFileName, bytes: webpStat.size },
        jpg: { file: jpgFileName, bytes: jpgStat.size },
      };

      // Check file size budgets (enforce for mobile 480 or base widths)
      const checkKb = Math.round(avifStat.size / 1024);
      if (w <= 480 && checkKb > slot.budgetMaxKb) {
        console.error(
          `❌ BUDGET VIOLATION for slot "${slot.id}" (${w}px): ${checkKb} KB exceeds budget ${slot.budgetMaxKb} KB!`
        );
        hasBudgetViolation = true;
      }
    }

    manifest.slots[slot.id] = slotManifest;
    console.log(`✓ Processed slot [${slot.id}] (${slot.widths.join(', ')}px)`);
  }

  // Write manifest.json
  const manifestPath = path.resolve(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n📄 Manifest written to: ${manifestPath}`);

  if (hasBudgetViolation) {
    console.error('\n🚨 Image optimization failed budget checks.');
    process.exit(1);
  }

  console.log('✅ Image pipeline optimization completed successfully within budgets.');
}

run().catch((err) => {
  console.error('Fatal error during image optimization:', err);
  process.exit(1);
});
