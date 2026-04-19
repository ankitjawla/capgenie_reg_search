import { NextResponse } from 'next/server';
import { extractBankProfileWithTrace } from '@/lib/llm';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult } from '@/lib/types';
import { classifyLLMError, logJson, newRequestId } from '@/lib/errors';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { cacheGet, cachePut } from '@/lib/db';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  const requestId = newRequestId();
  const clientKey = getClientKey(req);
  const limit = rateLimit(`analyze:${clientKey}`, { capacity: 5, refillPerSec: 5 / 60 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.', kind: 'rate_limit', requestId },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSec),
          'X-Request-Id': requestId,
        },
      },
    );
  }

  let bankName: string | undefined;
  try {
    const body = (await req.json()) as { bankName?: string };
    bankName = body.bankName?.trim();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body.', requestId },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }

  if (!bankName) {
    return NextResponse.json(
      { error: 'bankName is required.', requestId },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }

  logJson({ level: 'info', requestId, route: '/api/analyze', msg: 'analyze.start', bankName });

  const cached = await cacheGet(bankName);
  if (cached) {
    logJson({ level: 'info', requestId, route: '/api/analyze', msg: 'analyze.cache_hit', bankName });
    return NextResponse.json(
      { ...cached, fromCache: true, requestId },
      { headers: { 'X-Request-Id': requestId } },
    );
  }

  try {
    const { profile, trace } = await extractBankProfileWithTrace(bankName);
    const reports = applyRules(profile);
    const warnings: string[] = [];

    if (profile.assetSizeTier === 'unknown') {
      warnings.push('Asset size could not be determined; report thresholds may be approximate.');
    }
    if (profile.presence.length === 0) {
      warnings.push('No regulated presence detected in US, UK, EU, or India.');
    }
    if ((profile.rationale?.length ?? 0) < 200) {
      warnings.push('Rationale is short — the agent may have skipped the cross-verification step.');
    }
    if ((profile.sources?.length ?? 0) < 3) {
      warnings.push('Fewer than 3 sources were cited — treat the classification as lower confidence.');
    }

    const result: AnalysisResult = {
      profile,
      reports,
      generatedAtIso: new Date().toISOString(),
      warnings: warnings.length ? warnings : undefined,
      trace,
    };
    await cachePut(bankName, result);
    logJson({
      level: 'info',
      requestId,
      route: '/api/analyze',
      msg: 'analyze.complete',
      bankName,
      reportCount: reports.length,
    });
    return NextResponse.json(
      { ...result, requestId },
      { headers: { 'X-Request-Id': requestId } },
    );
  } catch (err: unknown) {
    const [payload, status] = classifyLLMError(err);
    logJson({
      level: 'error',
      requestId,
      route: '/api/analyze',
      msg: 'analyze.error',
      kind: payload.kind,
      err: payload.error,
    });
    return NextResponse.json(
      { ...payload, requestId },
      { status, headers: { 'X-Request-Id': requestId } },
    );
  }
}
