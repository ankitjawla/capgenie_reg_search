import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui-check',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'tests/ui-check/report.json' }]],
  use: {
    baseURL: process.env.UI_CHECK_URL ?? 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'on',
  },
  outputDir: 'tests/ui-check/snapshots',
  timeout: 90_000,
});
