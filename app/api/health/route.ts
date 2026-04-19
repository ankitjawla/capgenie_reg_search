// Lightweight health probe. Doesn't burn Azure / Tavily credits — just
// reports config presence so external monitors can detect mis-configuration.

import { dbEnabled } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const azureConfigured =
    !!process.env.AZURE_OPENAI_API_KEY &&
    !!process.env.AZURE_OPENAI_ENDPOINT &&
    !!process.env.AZURE_OPENAI_DEPLOYMENT;
  const searchConfigured =
    !!process.env.TAVILY_API_KEY ||
    !!process.env.SERPAPI_KEY ||
    !!process.env.BING_SEARCH_API_KEY;
  const sentryConfigured = !!process.env.SENTRY_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DSN;

  const ready = azureConfigured && searchConfigured;

  return Response.json(
    {
      status: ready ? 'ok' : 'degraded',
      version: process.env.npm_package_version ?? 'unknown',
      gitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      env: {
        azure: azureConfigured,
        search: searchConfigured,
        searchProvider: process.env.TAVILY_API_KEY
          ? 'tavily'
          : process.env.SERPAPI_KEY
          ? 'serpapi'
          : process.env.BING_SEARCH_API_KEY
          ? 'bing'
          : null,
        db: dbEnabled,
        sentry: sentryConfigured,
      },
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
