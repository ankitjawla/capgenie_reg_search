import { analysisHistory, dbEnabled, recentAnalyses } from '@/lib/db';
import { logJson, newRequestId } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const requestId = newRequestId();
  const url = new URL(req.url);
  const bankName = url.searchParams.get('bankName')?.trim();
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 25), 100);

  // Without bankName: return the most-recent analyses across every bank.
  // This backs the global /history page.
  if (!bankName) {
    const rows = await recentAnalyses(limit);
    logJson({
      level: 'info',
      requestId,
      route: '/api/history',
      msg: 'history.recent',
      rowCount: rows.length,
      dbEnabled,
    });
    return Response.json(
      { dbEnabled, entries: rows, requestId },
      { headers: { 'X-Request-Id': requestId } },
    );
  }

  const rows = await analysisHistory(bankName, limit);
  logJson({
    level: 'info',
    requestId,
    route: '/api/history',
    msg: 'history.served',
    bankName,
    rowCount: rows.length,
    dbEnabled,
  });
  return Response.json(
    { bankName, dbEnabled, entries: rows, requestId },
    { headers: { 'X-Request-Id': requestId } },
  );
}
