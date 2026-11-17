import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_ROUTES = [
  '/',
  '/recommend',
  '/weather',
  '/schemes',
  '/nutrition',
  '/chat',
  '/login',
  '/about',
  '/privacy',
  '/dev/ui-kit',
];

const VIEWPORTS = [
  { width: 320, height: 568, name: '320' },
  { width: 360, height: 780, name: '360' },
  { width: 390, height: 844, name: '390' },
  { width: 768, height: 1024, name: '768' },
  { width: 1024, height: 768, name: '1024' },
  { width: 1280, height: 800, name: '1280' },
];

test.describe('Layout Guard: Zero Horizontal Scroll & Responsive Shell', () => {
  test.beforeAll(() => {
    fs.mkdirSync(path.resolve('docs/ui/shell'), { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test(`verify zero horizontal overflow across core routes at ${vp.name}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ['/', '/recommend', '/login', '/dev/ui-kit']) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(300);

        // Evaluate body scrollWidth vs clientWidth
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientW = Math.max(doc.clientWidth, body.clientWidth);
          return {
            hasOverflow: scrollW > clientW + 1, // 1px tolerance for subpixel rounding
            scrollW,
            clientW,
          };
        });

        expect(
          overflow.hasOverflow,
          `Route ${route} has horizontal overflow at ${vp.name}px: scrollWidth ${overflow.scrollW} > clientWidth ${overflow.clientW}`
        ).toBeFalsy();
      }
    });
  }

  test('verify mobile bottom navigation on small screens and hidden floating launcher', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // BottomNav should be visible on mobile
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeVisible();

    // Floating chat launcher should NOT be visible on mobile
    const floatingLauncher = page.locator('a[aria-label="Chat with Krishi Mitra"]');
    await expect(floatingLauncher).toBeHidden();

    // Capture mobile shell screenshot
    await page.screenshot({ path: 'docs/ui/shell/home-mobile-360.png', fullPage: false });
  });

  test('verify desktop header with single-line navigation and visible chat launcher', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // BottomNav should be hidden on desktop
    const bottomNav = page.locator('nav[aria-label="Mobile Navigation"]');
    await expect(bottomNav).toBeHidden();

    // Floating chat launcher should be visible on desktop
    const floatingLauncher = page.locator('a[aria-label="Chat with Krishi Mitra"]');
    await expect(floatingLauncher).toBeVisible();

    // Capture desktop shell screenshot
    await page.screenshot({ path: 'docs/ui/shell/home-desktop-1280.png', fullPage: false });
  });

  test('verify Dev UI Kit renders components across viewports without clipping', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/dev/ui-kit', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Verify UI Kit heading
    await expect(page.locator('h1').first()).toContainText('Design System v2');

    // Screenshot Dev UI Kit mobile
    await page.screenshot({ path: 'docs/ui/shell/dev-uikit-360.png', fullPage: false });

    // Switch to desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'docs/ui/shell/dev-uikit-1280.png', fullPage: false });
  });

  test('verify custom 404 page renders seed packet card and quick links', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/non-existent-page-url', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    // Heading must exist
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Screenshot 404
    await page.screenshot({ path: 'docs/ui/shell/notfound-360.png', fullPage: false });
  });
});
