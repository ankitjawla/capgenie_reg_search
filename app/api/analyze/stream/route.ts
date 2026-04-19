import { extractBankProfileWithTrace, type StreamEvent } from '@/lib/llm';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult } from '@/lib/types';
import { classifyLLMError } from '@/lib/errors';

export const runtime = 'nodejs';
export const maxDuration = 180;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { result: AnalysisResult; expiresAt: number }>();

function cacheKey(bankName: string): string {
  return bankName.trim().toLowerCase();
}

type ServerEvent =
  | StreamEvent
  | { type: 'result'; result: AnalysisResult }
  | { type: 'error'; error: string; kind: string };

export async function POST(req: Request) {
  let bankName: string | undefined;
  try {
    const body = (await req.json()) as { bankName?: string };
    bankName = body.bankName?.trim();
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!bankName) {
    return Response.json({ error: 'bankName is required.' }, { status: 400 });
  }
  const name = bankName;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (evt: ServerEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      };

      const key = cacheKey(name);
      const cached = cache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        send({ type: 'info', message: 'Returning cached result.' });
        send({ type: 'result', result: { ...cached.result, fromCache: true } });
        controller.close();
        return;
      }

      try {
        const { profile, trace } = await extractBankProfileWithTrace(name, {
          onEvent: (evt) => send(evt),
        });
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
        send({ type: 'result', result });
      } catch (err: unknown) {
        console.error('stream route error', err);
        const [payload] = classifyLLMError(err);
        send({ type: 'error', error: payload.error, kind: payload.kind });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
