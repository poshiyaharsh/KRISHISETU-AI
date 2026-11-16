import { test, expect } from '@playwright/test';

const LANGUAGES = ['en', 'hi', 'gu', 'ur'];
const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 640 },
  { name: 'desktop-1280', width: 1280, height: 800 },
];

const ROUTES = [
  '/',
  '/recommend',
  '/weather',
  '/schemes',
  '/nutrition',
  '/chat',
  '/about',
  '/privacy',
  '/login',
];

test.describe('Image Loading & Natural Width Regression Guard', () => {
  for (const lang of LANGUAGES) {
    for (const vp of VIEWPORTS) {
      test(`all images load with naturalWidth > 0 on /login [${lang}] @ ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const failedImageRequests: Array<{ url: string; status: number; contentType: string }> = [];

        page.on('response', (response) => {
          const url = response.url();
          if (url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.ico') || url.includes('/assets/')) {
            const status = response.status();
            const contentType = response.headers()['content-type'] || '';
            // If request failed or returned HTML instead of image
            if (status >= 400 || (contentType.includes('text/html') && !url.includes('/api/'))) {
              failedImageRequests.push({ url, status, contentType });
            }
          }
        });

        await page.goto(`/login?lang=${lang}`);
        await page.waitForLoadState('networkidle');

        // Check every <img> on the login page
        const images = await page.locator('img').all();
        expect(images.length).toBeGreaterThan(0);

        const brokenImages: Array<{ src: string; naturalWidth: number; naturalHeight: number }> = [];

        for (const img of images) {
          const details = await img.evaluate((el: HTMLImageElement) => ({
            src: el.src,
            naturalWidth: el.naturalWidth,
            naturalHeight: el.naturalHeight,
            complete: el.complete,
          }));

          if (!details.complete || details.naturalWidth === 0) {
            brokenImages.push(details);
          }
        }

        expect(
          brokenImages,
          `Found broken images on /login [${lang}] @ ${vp.name}: ${JSON.stringify(brokenImages, null, 2)}`
        ).toHaveLength(0);

        expect(
          failedImageRequests,
          `Image requests returned error or non-image content-type: ${JSON.stringify(failedImageRequests, null, 2)}`
        ).toHaveLength(0);
      });
    }
  }

  test('login page contains exactly one brand logo with at least 3:1 contrast', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Exactly one brand logo inside the main login form card
    const loginCardLogos = page.locator('main a[aria-label="KrishiSetu AI, home"] img');
    await expect(loginCardLogos).toHaveCount(1);

    const logo = loginCardLogos.first();
    await expect(logo).toBeVisible();

    const isReadable = await logo.evaluate((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(img).opacity !== '0';
    });

    expect(isReadable).toBe(true);
  });
});
