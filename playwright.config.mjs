// Playwright render/E2E config — DEV-ONLY (R19 Tier A). Closes the repo's render-test gap:
// every app surface + info page must boot with zero console/page errors, and the key
// interactions must run clean. Serves the committed static tree over http (the app fetch()es
// /data/*.json, so file:// won't work) — exactly how it deploys. No shipped bytes change.
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:8000',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  // Serve the repo root (= the Pages web root) so URLs match production exactly.
  webServer: {
    command: 'python3 -m http.server 8000',
    url: 'http://localhost:8000/app/app.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
