import { test, expect } from '@playwright/test';

test.describe('Core User Journeys', () => {
  test('1. Crop recommendation journey: fill sample values and view top 3 crops', async ({ page }) => {
    await page.goto('/recommend');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Populate with sample agricultural values
    const sampleBtn = page.getByRole('button', { name: /Fill Sample Values/i });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // Submit form
    const submitBtn = page.getByRole('button', { name: /Recommend/i });
    await submitBtn.click();

    // Verify top 3 crop recommendations appear
    await expect(page.getByText(/Top/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/%/).first()).toBeVisible();
  });

  test('2. Weather by district journey: select state & district and view weather card', async ({ page }) => {
    // Mock upstream weather API route if offline, while hitting real locations DB
    await page.route('**/api/weather/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          latitude: 22.3039,
          longitude: 70.8022,
          timezone: 'Asia/Kolkata',
          fetched_at: '2026-11-12T10:00:00Z',
          stale: false,
          current: {
            temperature: 29.5,
            relative_humidity: 58,
            wind_speed: 12,
            precipitation: 0,
            weather_code: 0,
            condition: 'clear',
          },
          daily: [
            {
              date: '2026-11-12',
              temp_max: 33,
              temp_min: 21,
              precipitation_sum: 0,
              precipitation_probability: 5,
              wind_speed_max: 14,
              weather_code: 0,
              condition: 'clear',
              et0: 4.5,
            },
          ],
        }),
      });
    });

    await page.goto('/weather');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Wait for state selector to populate from seeded backend
    const stateSelect = page.getByLabel(/State/i);
    await expect(stateSelect).toBeVisible();
    await expect(stateSelect.locator('option')).not.toHaveCount(1, { timeout: 10000 });

    // Select Gujarat if present, otherwise first non-empty state
    const gujaratOption = stateSelect.locator('option', { hasText: /Gujarat/i });
    if ((await gujaratOption.count()) > 0) {
      await stateSelect.selectOption({ label: await gujaratOption.first().innerText() });
    }

    const districtSelect = page.getByLabel(/District/i);
    await expect(districtSelect).toBeEnabled({ timeout: 10000 });
    await expect(districtSelect.locator('option')).not.toHaveCount(1, { timeout: 10000 });
    const secondOptValue = await districtSelect.locator('option').nth(1).getAttribute('value');
    if (secondOptValue) {
      await districtSelect.selectOption(secondOptValue);
    }

    // Verify weather card renders temperature and humidity
    await expect(page.getByText('30°C')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('58%')).toBeVisible();
  });

  test('3. Scheme search and detail journey', async ({ page }) => {
    await page.goto('/schemes');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Search for PM-KISAN
    const searchInput = page.getByPlaceholder(/Search/i);
    await searchInput.fill('KISAN');

    // Click the first scheme card link
    const firstSchemeLink = page.locator('a[href^="/schemes/"]').first();
    await expect(firstSchemeLink).toBeVisible({ timeout: 10000 });
    await firstSchemeLink.click();

    // Verify detail page loads with heading and official portal link
    await expect(page).toHaveURL(/\/schemes\/.+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('a[target="_blank"]').first()).toBeVisible();
  });

  test('4. Chat smoke test with mocked LLM', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const sseBody = [
        `data: ${JSON.stringify({
          type: 'sources',
          sources: [
            {
              title: 'PM-KISAN Scheme',
              url: '/schemes/pm-kisan',
              source_type: 'scheme',
            },
          ],
        })}\n\n`,
        `data: ${JSON.stringify({
          type: 'token',
          content: 'PM-KISAN provides Rs 6,000 per year to eligible farmer families in three installments.',
        })}\n\n`,
        `data: ${JSON.stringify({
          type: 'done',
          session_id: 'e2e-session-1',
          language: 'en',
        })}\n\n`,
      ].join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: sseBody,
      });
    });

    await page.goto('/chat');
    await expect(page.getByRole('heading', { level: 1, name: /Krishi Mitra/i })).toBeVisible();
    await expect(page.getByRole('region', { name: /Agricultural Safety Notice/i })).toBeVisible();

    const input = page.getByLabel(/Ask Krishi Mitra/i);
    await input.fill('What are the benefits of PM-KISAN?');
    await page.getByRole('button', { name: /Send message/i }).click();

    await expect(
      page.getByText(/PM-KISAN provides Rs 6,000 per year/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('5. Language switch journey across en, hi, gu, and ur (RTL)', async ({ page }) => {
    await page.goto('/');

    const langTrigger = page.getByRole('button', { name: /Language selector/i }).first();
    await expect(langTrigger).toBeVisible();

    // Switch to Hindi
    await langTrigger.click();
    await page.getByRole('option', { name: /हिन्दी/i }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    // Switch to Gujarati
    await langTrigger.click();
    await page.getByRole('option', { name: /ગુજરાતી/i }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'gu');

    // Switch to Urdu and verify RTL
    await langTrigger.click();
    const searchBox = page.getByPlaceholder(/Search/i);
    await searchBox.fill('Urdu');
    await page.getByRole('option', { name: /اردو/i }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ur');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // Reset back to English
    await langTrigger.click();
    await page.getByRole('option', { name: /English/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});
