import * as Sentry from '@sentry/nextjs';
import { extractBankProfileWithTrace, type StreamEvent } from '@/lib/llm';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult } from '@/lib/types';
import { classifyLLMError, logJson, newRequestId } from '@/lib/errors';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { cacheGet, cachePut, singleflight, RULES_VERSION } from '@/lib/db';
import { analyzeRequestSchema } from '@/lib/validation';
import { isOriginAllowed } from '@/lib/origin-check';
import { annotateWithEvidence } from '@/lib/agent/evidence';

export const runtime = 'nodejs';
export const maxDuration = 180;

// Debounce text deltas: coalesce model chunks that arrive within this window
// so we don't fire one SSE message per token on slow clients.
const TEXT_DELTA_FLUSH_MS = 60;
const TEXT_DELTA_FLUSH_CHARS = 48;
// SSE comment line every 15s — survives Vercel / CDN idle timeouts (~60s).
const HEARTBEAT_MS = 15_000;

type ServerEvent =
  | StreamEvent
  | { type: 'result'; result: AnalysisResult }
  | { type: 'error'; error: string; kind: string };

export async function POST(req: Request) {
  const requestId = newRequestId();

  if (!isOriginAllowed(req)) {
    return Response.json(
      { error: 'Origin not allowed.', kind: 'bad_request', requestId },
      { status: 403, headers: { 'X-Request-Id': requestId } },
    );
  }

  const clientKey = getClientKey(req);
  // Shared "user" bucket for analyze + chat so alternating endpoints
  // doesn't bypass the per-IP budget.
  const limit = rateLimit(`user:${clientKey}`, { capacity: 5, refillPerSec: 5 / 60 });
  if (!limit.allowed) {
    return Response.json(
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

  let parsed;
  try {
    parsed = analyzeRequestSchema.safeParse(await req.json());
  } catch {
    return Response.json(
      { error: 'Invalid JSON body.', requestId },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues.map((i) => i.message).join('; '),
        kind: 'bad_request',
        requestId,
      },
      { status: 400, headers: { 'X-Request-Id': requestId } },
    );
  }
  const { bankName } = parsed.data;
  logJson({ level: 'info', requestId, route: '/api/analyze/stream', msg: 'stream.start', bankName });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safeEnqueue = (bytes: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(bytes);
        } catch {
          closed = true;
        }
      };
      const send = (evt: ServerEvent) =>
        safeEnqueue(encoder.encode(`data: ${JSON.stringify(evt)}\n\n`));
      const heartbeat = () => safeEnqueue(encoder.encode(`: keep-alive\n\n`));

      // Coalesce rapid text deltas.
      let textBuffer = '';
      let flushTimer: NodeJS.Timeout | null = null;
      const flushText = () => {
        if (!textBuffer) return;
        send({ type: 'text', delta: textBuffer });
        textBuffer = '';
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
      };
      const bufferTextEvent = (delta: string) => {
        textBuffer += delta;
        if (textBuffer.length >= TEXT_DELTA_FLUSH_CHARS) {
          flushText();
        } else if (!flushTimer) {
          flushTimer = setTimeout(flushText, TEXT_DELTA_FLUSH_MS);
        }
      };

      const hbTimer = setInterval(heartbeat, HEARTBEAT_MS);

      // Abort the upstream agent when the client disconnects.
      const controllerAbort = new AbortController();
      req.signal.addEventListener('abort', () => controllerAbort.abort(), { once: true });

      try {
        const cached = await cacheGet(bankName);
        if (cached) {
          send({ type: 'info', message: 'Returning cached result.' });
          send({ type: 'result', result: { ...cached, fromCache: true } });
          return;
        }

        const result = await singleflight(bankName, async () => {
          const { profile, trace } = await extractBankProfileWithTrace(bankName, {
            onEvent: (evt) => {
              if (evt.type === 'text') bufferTextEvent(evt.delta);
              else send(evt);
            },
            signal: controllerAbort.signal,
            requestId,
          });
          flushText();
          let reports = applyRules(profile);
          // Post-synthesis evidence-citation pass — non-fatal if it fails.
          send({ type: 'info', message: 'Linking reports to cited sources…' });
          reports = await annotateWithEvidence(profile, reports, {
            signal: controllerAbort.signal,
            requestId,
          });
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
          // Hallucination guardrail: if a high-risk flag is set (G-SIB,
          // D-SIB, FDIC, FBO) but the model cited no sources, demote every
          // report's confidence one step and warn.
          const highRiskFlag =
            profile.isGSIB ||
            profile.isDSIB ||
            profile.isFDICInsured ||
            profile.presence.some((p) => p.isFBO);
          if (highRiskFlag && (profile.sources?.length ?? 0) === 0) {
            warnings.push('A high-risk flag (G-SIB / D-SIB / FBO / FDIC) was declared without source citations — every report confidence has been demoted.');
            for (const r of reports) {
              r.confidence = r.confidence === 'high' ? 'medium' : r.confidence === 'medium' ? 'low' : 'low';
            }
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

        send({ type: 'result', result });
      } catch (err: unknown) {
        flushText();
        // Client disconnects surface as AbortError — don't log as an error.
        if ((err as Error)?.name === 'AbortError') {
          logJson({
            level: 'info',
            requestId,
            route: '/api/analyze/stream',
            msg: 'stream.aborted_by_client',
            bankName,
          });
        } else {
          logJson({
            level: 'error',
            requestId,
            route: '/api/analyze/stream',
            msg: 'stream.error',
            bankName,
            err: (err as Error).message,
          });
          Sentry.captureException(err, {
            extra: { requestId, route: '/api/analyze/stream', bankName },
          });
          const [payload] = classifyLLMError(err);
          send({ type: 'error', error: payload.error, kind: payload.kind });
        }
      } finally {
        clearInterval(hbTimer);
        flushText();
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Request-Id': requestId,
      'X-Rules-Version': RULES_VERSION,
    },
  });
}
