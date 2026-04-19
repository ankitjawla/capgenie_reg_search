import { analysisHistory, dbEnabled } from '@/lib/db';
import { logJson, newRequestId } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const requestId = newRequestId();
  const url = new URL(req.url);
  const bankName = url.searchParams.get('bankName')?.trim();
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 10), 50);

  if (!bankName) {
    return Response.json(
      { error: 'bankName query param is required.', requestId },
      { status: 400, headers: { 'X-Request-Id': requestId } },
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
