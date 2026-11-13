import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

// Languages to test
const LANGUAGES = ['en', 'hi', 'gu', 'ur'];

// Routes covering the whole application matrix
const SCENARIOS = [
  { name: 'home', path: '/' },
  { name: 'recommend', path: '/recommend' },
  { name: 'weather', path: '/weather' },
  { name: 'schemes', path: '/schemes' },
  { name: 'scheme-detail', path: '/schemes/pm-kisan' },
  { name: 'nutrition-single-raw', path: '/nutrition?mode=single&state=raw' },
  { name: 'nutrition-single-cooked', path: '/nutrition?mode=single&state=cooked' },
  { name: 'nutrition-compare', path: '/nutrition?mode=compare' },
  { name: 'chat-empty', path: '/chat' },
  { name: 'about', path: '/about' },
  { name: 'privacy', path: '/privacy' },
  { name: 'not-found', path: '/non-existent-page' },
];

test.describe('Automated Contrast Sweep', () => {
  for (const lang of LANGUAGES) {
    for (const scenario of SCENARIOS) {
      test(`contrast check for ${scenario.name} in [${lang}]`, async ({ page }, testInfo) => {
        // Mock weather API to prevent network instability
        await page.route('**/api/weather/**', async (r) => {
          await r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              latitude: 22.3,
              longitude: 70.8,
              timezone: 'Asia/Kolkata',
              fetched_at: '2026-11-13T10:00:00Z',
              stale: false,
              current: {
                temperature: 28,
                relative_humidity: 60,
                wind_speed: 10,
                precipitation: 0,
                weather_code: 0,
                condition: 'clear',
              },
              daily: [],
            }),
          });
        });

        // Mock chat status API
        await page.route('**/api/chat/status/**', async (r) => {
          await r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              available: true,
              reason_code: 'ready',
              knowledge_chunks: 42,
            }),
          });
        });

        // Set language in localStorage
        await page.addInitScript((l) => {
          window.localStorage.setItem('i18nextLng', l);
        }, lang);

        await page.goto(scenario.path);

        // Wait for main content or heading to render
        await page.waitForTimeout(600);

        // Run axe color-contrast
        const axeResults = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .analyze();

        // Custom DOM walker for fine-grained contrast measurement
        const domViolations = await page.evaluate(() => {
          function parseRgba(str) {
            const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!m) return null;
            return {
              r: parseInt(m[1], 10),
              g: parseInt(m[2], 10),
              b: parseInt(m[3], 10),
              a: m[4] !== undefined ? parseFloat(m[4]) : 1,
            };
          }

          function getLuminance(r, g, b) {
            const a = [r, g, b].map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }

          function getContrastRatio(fg, bg) {
            const l1 = getLuminance(fg.r, fg.g, fg.b);
            const l2 = getLuminance(bg.r, bg.g, bg.b);
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
          }

          function blend(fg, bg) {
            const a = fg.a;
            return {
              r: Math.round(fg.r * a + bg.r * (1 - a)),
              g: Math.round(fg.g * a + bg.g * (1 - a)),
              b: Math.round(fg.b * a + bg.b * (1 - a)),
              a: 1,
            };
          }

          function getEffectiveBg(el) {
            let cur = el;
            let currentBg = { r: 245, g: 240, b: 220, a: 1 }; // default brand cream canvas #F5F0DC
            const layers = [];

            while (cur && cur !== document.documentElement) {
              const style = window.getComputedStyle(cur);
              const bg = parseRgba(style.backgroundColor);
              if (bg && bg.a > 0) {
                layers.unshift(bg);
              }
              cur = cur.parentElement;
            }

            for (const layer of layers) {
              currentBg = blend(layer, currentBg);
            }
            return currentBg;
          }

          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const results = [];

          let node;
          while ((node = walker.nextNode())) {
            const text = node.textContent?.trim();
            if (!text || text.length === 0) continue;

            const parent = node.parentElement;
            if (!parent) continue;

            // Skip hidden, decorative, or ignored elements
            if (parent.closest('[data-contrast-ignore]')) continue;
            if (parent.closest('script, style, noscript, svg')) continue;

            const rect = parent.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;

            const style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
              continue;
            }

            const fg = parseRgba(style.color);
            if (!fg || fg.a === 0) continue;

            const bg = getEffectiveBg(parent);
            const ratio = getContrastRatio(blend(fg, bg), bg);

            const fontSize = parseFloat(style.fontSize);
            const fontWeight = parseInt(style.fontWeight, 10) || 400;
            const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
            const minRatio = isLarge ? 3.0 : 4.5;

            if (ratio < minRatio) {
              results.push({
                text: text.slice(0, 40),
                tagName: parent.tagName,
                className: parent.className,
                ratio: Math.round(ratio * 100) / 100,
                required: minRatio,
                color: style.color,
                bg: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
              });
            }
          }
          return results;
        });

        // Fail if any severe contrast violation occurred
        const allViolations = [
          ...axeResults.violations.map((v) => ({
            type: 'axe',
            help: v.help,
            nodes: v.nodes.map((n) => n.target.join(' ')),
          })),
          ...domViolations.map((v) => ({
            type: 'dom-scan',
            text: v.text,
            ratio: v.ratio,
            required: v.required,
            element: `${v.tagName}.${v.className}`,
          })),
        ];

        expect(
          allViolations,
          `Contrast failures on ${scenario.name} [${lang}]: ${JSON.stringify(allViolations, null, 2)}`
        ).toEqual([]);
      });
    }
  }
});
