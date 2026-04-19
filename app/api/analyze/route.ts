import { NextResponse } from 'next/server';
import { extractBankProfileWithTrace } from '@/lib/llm';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult } from '@/lib/types';
import { classifyLLMError } from '@/lib/errors';

export const runtime = 'nodejs';
export const maxDuration = 120;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { result: AnalysisResult; expiresAt: number }>();

function cacheKey(bankName: string): string {
  return bankName.trim().toLowerCase();
}

export async function POST(req: Request) {
  let bankName: string | undefined;
  try {
    const body = (await req.json()) as { bankName?: string };
    bankName = body.bankName?.trim();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!bankName) {
    return NextResponse.json({ error: 'bankName is required.' }, { status: 400 });
  }

  const key = cacheKey(bankName);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.result, fromCache: true });
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
    cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('analyze route error', err);
    const [payload, status] = classifyLLMError(err);
    return NextResponse.json(payload, { status });
  }
}
