import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/recommend', '/weather', '/schemes', '/nutrition', '/chat'];

test.describe('Accessibility Audit (axe-core)', () => {
  for (const route of ROUTES) {
    test(`zero critical or serious violations on ${route}`, async ({ page }) => {
      // Avoid external network flakiness on /weather during a11y scan
      if (route === '/weather') {
        await page.route('**/api/weather/**', async (r) => {
          await r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              latitude: 22.3,
              longitude: 70.8,
              timezone: 'Asia/Kolkata',
              fetched_at: '2026-11-12T10:00:00Z',
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
      }

      await page.goto(route);
      // Wait for main heading or content to finish lazy-loading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const severeViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(
        severeViolations,
        `Found severe a11y violations on ${route}: ${JSON.stringify(severeViolations, null, 2)}`
      ).toEqual([]);
    });
  }
});
