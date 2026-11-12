import { test, expect } from '@playwright/test';

test.describe('PWA & Offline Fallback', () => {
  test('serves friendly offline.html fallback page and valid sw.js', async ({ page }) => {
    const swRes = await page.request.get('/sw.js');
    expect(swRes.status()).toBe(200);
    const swText = await swRes.text();
    expect(swText).toContain("url.pathname.startsWith('/api/')");

    await page.goto('/offline.html');
    await expect(page.getByRole('heading', { name: /You are currently offline/i })).toBeVisible();
    await expect(page.getByText(/1800-180-1551/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();
  });
});
