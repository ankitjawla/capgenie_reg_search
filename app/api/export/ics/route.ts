import { isOriginAllowed } from '@/lib/origin-check';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { logJson, newRequestId } from '@/lib/errors';
import { buildIcs } from '@/lib/ics';
import type { AnalysisResult } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const requestId = newRequestId();
  if (!isOriginAllowed(req)) {
    return Response.json({ error: 'Origin not allowed.', requestId }, { status: 403 });
  }
  const limit = rateLimit(`ics:${getClientKey(req)}`, { capacity: 20, refillPerSec: 20 / 60 });
  if (!limit.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded.', requestId },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  let body: { result: AnalysisResult; bankName?: string };
  try {
    body = (await req.json()) as { result: AnalysisResult; bankName?: string };
  } catch {
    return Response.json({ error: 'Invalid JSON body.', requestId }, { status: 400 });
  }
  const result = body?.result;
  if (!result?.profile || !Array.isArray(result?.reports)) {
    return Response.json({ error: 'profile + reports required.', requestId }, { status: 400 });
  }
  const bankName = body.bankName ?? result.profile.legalName;
  const ics = buildIcs({ bankName, reports: result.reports });
  logJson({
    level: 'info',
    requestId,
    route: '/api/export/ics',
    msg: 'ics.served',
    bank: bankName,
    bytes: ics.length,
  });
  const filename =
    bankName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-capgenie.ics';
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Request-Id': requestId,
    },
  });
}
