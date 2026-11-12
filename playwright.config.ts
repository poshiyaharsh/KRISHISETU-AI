import { defineConfig, devices } from '@playwright/test';

const pythonBin =
  process.env.PYTHON_BIN ||
  (process.platform === 'win32' ? 'backend\\.venv\\Scripts\\python.exe' : 'python3');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 780 },
      },
    },
  ],
  webServer: [
    {
      command: `${pythonBin} backend/manage.py runserver 8000 --noreload`,
      url: 'http://localhost:8000/api/health/',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
      env: {
        DJANGO_SETTINGS_MODULE: 'config.settings.dev',
        CHAT_LLM_PROVIDER: 'mock',
      },
    },
    {
      command: 'npm --prefix frontend run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
  ],
});
