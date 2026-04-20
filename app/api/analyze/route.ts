import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { extractBankProfileWithTrace } from '@/lib/llm';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult } from '@/lib/types';
import { classifyLLMError, logJson, newRequestId } from '@/lib/errors';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { cacheGet, cachePut, singleflight, RULES_VERSION } from '@/lib/db';
import { analyzeRequestSchema } from '@/lib/validation';
import { isOriginAllowed } from '@/lib/origin-check';
import { annotateWithEvidence } from '@/lib/agent/evidence';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: Request) {
  const requestId = newRequestId();

  if (!isOriginAllowed(req)) {
    return NextResponse.json(
      { error: 'Origin not allowed.', requestId },
      { status: 403, headers: { 'X-Request-Id': requestId } },
    );
  }

  const clientKey = getClientKey(req);
  const limit = rateLimit(`user:${clientKey}`, { capacity: 5, refillPerSec: 5 / 60 });
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

  const parsed = analyzeRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues.map((i) => i.message).join('; '),
        requestId,
      },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }
  const { bankName } = parsed.data;
  logJson({ level: 'info', requestId, route: '/api/analyze', msg: 'analyze.start', bankName });

  try {
    const cached = await cacheGet(bankName);
    if (cached) {
      logJson({ level: 'info', requestId, route: '/api/analyze', msg: 'analyze.cache_hit', bankName });
      return NextResponse.json(
        { ...cached, fromCache: true, requestId },
        { headers: { 'X-Request-Id': requestId, 'X-Rules-Version': RULES_VERSION } },
      );
    }

    const result = await singleflight(bankName, async () => {
      const { profile, trace } = await extractBankProfileWithTrace(bankName, {
        signal: req.signal,
        requestId,
      });
      let reports = applyRules(profile);
      reports = await annotateWithEvidence(profile, reports, { signal: req.signal, requestId });
      const warnings: string[] = [];
      if (profile.assetSizeTier === 'unknown') {
        warnings.push('Asset size could not be determined; report thresholds may be approximate.');
      }
      if (profile.presence.length === 0) {
        warnings.push('No regulated presence detected in any supported jurisdiction.');
      }
      if ((profile.rationale?.length ?? 0) < 200) {
        warnings.push('Rationale is short — the agent may have skipped the cross-verification step.');
      }
      if ((profile.sources?.length ?? 0) < 3) {
        warnings.push('Fewer than 3 sources were cited — treat the classification as lower confidence.');
      }

      const composed: AnalysisResult = {
        profile,
        reports,
        generatedAtIso: new Date().toISOString(),
        warnings: warnings.length ? warnings : undefined,
        trace,
      };
      await cachePut(bankName, composed);
      return composed;
    });

    logJson({
      level: 'info',
      requestId,
      route: '/api/analyze',
      msg: 'analyze.complete',
      bankName,
      reportCount: result.reports.length,
    });
    return NextResponse.json(
      { ...result, requestId },
      { headers: { 'X-Request-Id': requestId, 'X-Rules-Version': RULES_VERSION } },
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
    Sentry.captureException(err, { extra: { requestId, route: '/api/analyze', bankName } });
    return NextResponse.json(
      { ...payload, requestId },
      { status, headers: { 'X-Request-Id': requestId } },
    );
  }
}
