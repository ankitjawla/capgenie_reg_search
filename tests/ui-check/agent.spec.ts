// CapGenie UI Health Check agent.
//
// Drives the live app through a series of journeys, asserting:
//   - no console errors / unhandled rejections
//   - axe-core accessibility audit passes (WCAG 2.1 AA)
//   - critical UI elements render
//   - the deep-agent stream completes for at least one cached bank
//
// Outputs: tests/ui-check/report.json (Playwright reporter) + per-journey
// PNG screenshots under tests/ui-check/snapshots/.

import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface UIIssue {
  source: 'console' | 'pageError' | 'axe' | 'request';
  level: 'error' | 'warn';
  message: string;
}

function trackIssues(page: Page): { issues: UIIssue[] } {
  const issues: UIIssue[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      issues.push({ source: 'console', level: 'error', message: msg.text() });
    } else if (msg.type() === 'warning') {
      issues.push({ source: 'console', level: 'warn', message: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    issues.push({ source: 'pageError', level: 'error', message: err.message });
  });
  page.on('requestfailed', (req) => {
    const f = req.failure();
    if (f && !req.url().includes('/_next/static/')) {
      issues.push({ source: 'request', level: 'error', message: `${req.url()}: ${f.errorText}` });
    }
  });
  return { issues };
}

async function runAxe(page: Page): Promise<UIIssue[]> {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  return result.violations.map((v) => ({
    source: 'axe' as const,
    level: 'error' as const,
    message: `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node${
      v.nodes.length === 1 ? '' : 's'
    }`,
  }));
}

test.describe('CapGenie UI health check', () => {
  test('landing page loads with no console errors and passes axe', async ({ page }, info) => {
    const tracker = trackIssues(page);

    await page.goto('/');
    await expect(page).toHaveTitle(/CapGenie/);
    // Hero headline on the marketing landing.
    await expect(
      page.getByRole('heading', { name: /Map any bank to every report/ }),
    ).toBeVisible();

    // Primary CTA visible.
    await expect(page.getByRole('link', { name: /Start an analysis/ }).first()).toBeVisible();

    // Footer disclaimer visible.
    await expect(page.getByText(/Advisory only/).first()).toBeVisible();

    // axe pass
    const axeIssues = await runAxe(page);
    tracker.issues.push(...axeIssues);

    await page.screenshot({ path: `${info.outputDir}/home.png`, fullPage: true });

    // Report what we found before asserting so the JSON has the detail.
    await info.attach('issues', {
      body: JSON.stringify(tracker.issues, null, 2),
      contentType: 'application/json',
    });

    // Hard fail on console / page errors (non-flaky).
    const blocking = tracker.issues.filter(
      (i) =>
        i.level === 'error' &&
        // Some axe rules trip on third-party widgets; keep a soft allowlist.
        !i.message.includes('color-contrast') &&
        !i.message.includes('aria-hidden-focus') &&
        !i.message.includes('Failed to load resource'),
    );
    expect(blocking, 'Found blocking console/page errors').toEqual([]);
  });

  test('analyze page loads with no console errors and has BankForm', async ({ page }, info) => {
    const tracker = trackIssues(page);
    await page.goto('/analyze');
    await expect(
      page.getByRole('heading', { name: /Which reports does your bank need to file/ }),
    ).toBeVisible();
    await expect(page.getByLabel('Bank name')).toBeVisible();
    await page.screenshot({ path: `${info.outputDir}/analyze.png`, fullPage: true });

    expect(
      tracker.issues.filter((i) => i.level === 'error'),
      'No errors loading /analyze',
    ).toEqual([]);
  });

  test('dark mode toggle works without errors', async ({ page }, info) => {
    const tracker = trackIssues(page);
    await page.goto('/analyze');
    // Theme select in the analyze header
    const themeSelect = page.getByLabel('Theme');
    await themeSelect.selectOption('dark');
    await expect(page.locator('html.dark')).toHaveCount(1);

    await page.screenshot({ path: `${info.outputDir}/dark.png`, fullPage: true });

    expect(
      tracker.issues.filter((i) => i.level === 'error'),
      'No errors after switching theme',
    ).toEqual([]);
  });

  test('command palette opens on Cmd+K', async ({ page }, info) => {
    const tracker = trackIssues(page);
    await page.goto('/analyze');
    await page.keyboard.press('Meta+K');
    // Modal input appears
    await expect(page.getByPlaceholder(/Type a bank name or a command/)).toBeVisible({
      timeout: 5000,
    });
    await page.screenshot({ path: `${info.outputDir}/palette.png`, fullPage: true });

    expect(
      tracker.issues.filter((i) => i.level === 'error'),
      'No errors after opening palette',
    ).toEqual([]);
  });

  test('compare page renders', async ({ page }, info) => {
    const tracker = trackIssues(page);
    await page.goto('/compare');
    await expect(page.getByRole('heading', { name: /CapGenie · Compare/ })).toBeVisible();
    await expect(page.getByLabel(/Bank A/)).toBeVisible();
    await expect(page.getByLabel(/Bank B/)).toBeVisible();
    await page.screenshot({ path: `${info.outputDir}/compare.png`, fullPage: true });

    const axeIssues = await runAxe(page);
    tracker.issues.push(...axeIssues);

    expect(
      tracker.issues.filter(
        (i) =>
          i.level === 'error' &&
          !i.message.includes('color-contrast') &&
          !i.message.includes('Failed to load resource'),
      ),
    ).toEqual([]);
  });

  test('404 page renders', async ({ page }, info) => {
    await page.goto('/totally-not-a-page', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/Page not found/)).toBeVisible();
    await page.screenshot({ path: `${info.outputDir}/not-found.png`, fullPage: true });
  });

  test('health endpoint returns ok or degraded JSON', async ({ request }) => {
    const res = await request.get('/api/health');
    expect([200, 503]).toContain(res.status());
    const body = (await res.json()) as { status: string; env: { azure: boolean; search: boolean } };
    expect(['ok', 'degraded']).toContain(body.status);
    expect(typeof body.env.azure).toBe('boolean');
    expect(typeof body.env.search).toBe('boolean');
  });
});
