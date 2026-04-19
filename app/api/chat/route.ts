// Follow-up Q&A over the already-researched profile. Closed-book: the
// agent has no web_search tool here — it must answer strictly from the
// profile + reports + rationale provided in the request body.

import { AzureChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import * as Sentry from '@sentry/nextjs';
import type { BankProfile, ReportRecommendation } from '@/lib/types';
import { classifyLLMError, logJson, newRequestId } from '@/lib/errors';
import { getClientKey, rateLimit } from '@/lib/rate-limit';
import { chatRequestSchema } from '@/lib/validation';
import { isOriginAllowed } from '@/lib/origin-check';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TEXT_DELTA_FLUSH_MS = 60;
const TEXT_DELTA_FLUSH_CHARS = 48;
const HEARTBEAT_MS = 15_000;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildSystemPrompt(profile: BankProfile, reports: ReportRecommendation[]): string {
  const reportLines = reports
    .map(
      (r) =>
        `- [${r.jurisdiction}] ${r.shortName} (${r.frequency}, confidence=${r.confidence}): ${r.applicabilityReason}`,
    )
    .join('\n');

  return `You are CapGenie's follow-up assistant. Answer the user's questions about this bank's regulatory profile using ONLY the information below. Do NOT invent additional facts, and do NOT call any tools — you have no web access here.

If the user asks about a report that is NOT in the list, explain in one or two sentences why the rules engine did not include it (e.g., threshold not met, jurisdiction not present). If the profile itself lacks enough information to answer, say so plainly.

Keep answers concise (3-5 sentences by default).

---
BANK PROFILE
Legal name: ${profile.legalName}
Category: ${profile.category}
HQ country: ${profile.hqCountry ?? 'unknown'}
Global assets (USD B): ${profile.globalAssetsUsdB ?? 'unknown'}
Asset size tier: ${profile.assetSizeTier}
G-SIB: ${profile.isGSIB ?? 'unknown'}  D-SIB: ${profile.isDSIB ?? 'unknown'}  FDIC insured: ${profile.isFDICInsured ?? 'unknown'}
Broker-dealer subsidiary: ${profile.hasBrokerDealerSubsidiary ?? 'unknown'}  Insurance subsidiary: ${profile.hasInsuranceSubsidiary ?? 'unknown'}
Publicly listed: ${profile.isPubliclyListed ?? 'unknown'}

Presence:
${profile.presence
  .map(
    (p) =>
      `  - ${p.jurisdiction}: ${p.entityType}${p.isFBO ? ' (FBO)' : ''}${
        p.jurisdictionAssetsUsdB ? ` · ~$${p.jurisdictionAssetsUsdB}B` : ''
      }${p.notes ? ` — ${p.notes}` : ''}`,
  )
  .join('\n')}

Activities: ${profile.activities.join(', ') || '(none)'}

Rationale from research agent:
${profile.rationale ?? '(none)'}

---
APPLICABLE REPORTS (${reports.length}):
${reportLines}
`;
}

export async function POST(req: Request) {
  const requestId = newRequestId();

  if (!isOriginAllowed(req)) {
    return Response.json(
      { error: 'Origin not allowed.', requestId },
      { status: 403, headers: { 'X-Request-Id': requestId } },
    );
  }

  const clientKey = getClientKey(req);
  // Shared with analyze so alternating endpoints doesn't bypass the per-IP
  // budget. Chat is still cheap — 20 calls/min each refill 1/3s.
  const limit = rateLimit(`user:${clientKey}`, { capacity: 20, refillPerSec: 20 / 60 });
  if (!limit.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again shortly.', kind: 'rate_limit', requestId },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSec), 'X-Request-Id': requestId },
      },
    );
  }

  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => ({})));
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
  const body = parsed.data as {
    profile: BankProfile;
    reports: ReportRecommendation[];
    history: ChatMessage[];
    question: string;
  };
  logJson({ level: 'info', requestId, route: '/api/chat', msg: 'chat.start', q: body.question.slice(0, 80) });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const safe = (bytes: Uint8Array) => {
        if (closed) return;
        try {
          controller.enqueue(bytes);
        } catch {
          closed = true;
        }
      };
      const send = (payload: Record<string, unknown>) =>
        safe(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const heartbeat = () => safe(encoder.encode(`: keep-alive\n\n`));

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
      const pushDelta = (delta: string) => {
        textBuffer += delta;
        if (textBuffer.length >= TEXT_DELTA_FLUSH_CHARS) flushText();
        else if (!flushTimer) flushTimer = setTimeout(flushText, TEXT_DELTA_FLUSH_MS);
      };

      const hbTimer = setInterval(heartbeat, HEARTBEAT_MS);
      const controllerAbort = new AbortController();
      req.signal.addEventListener('abort', () => controllerAbort.abort(), { once: true });

      try {
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
        if (!apiKey || !endpoint || !deployment) {
          throw new Error(
            'Azure OpenAI is not fully configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT in your .env.local.',
          );
        }

        const llm = new AzureChatOpenAI({
          azureOpenAIApiKey: apiKey,
          azureOpenAIEndpoint: endpoint,
          azureOpenAIApiDeploymentName: deployment,
          azureOpenAIApiVersion: apiVersion,
          model: deployment,
          maxCompletionTokens: 1024,
          streaming: true,
        });

        const messages = [
          new SystemMessage(buildSystemPrompt(body.profile, body.reports)),
          ...body.history.map((m) =>
            m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content),
          ),
          new HumanMessage(body.question),
        ];

        const llmStream = await llm.stream(messages, { signal: controllerAbort.signal });
        for await (const chunk of llmStream) {
          const content = chunk?.content;
          if (typeof content === 'string' && content.length > 0) pushDelta(content);
        }
        flushText();
        send({ type: 'done' });
      } catch (err) {
        flushText();
        if ((err as Error)?.name === 'AbortError') {
          logJson({ level: 'info', requestId, route: '/api/chat', msg: 'chat.aborted_by_client' });
        } else {
          const [payload] = classifyLLMError(err);
          logJson({
            level: 'error',
            requestId,
            route: '/api/chat',
            msg: 'chat.error',
            err: payload.error,
          });
          Sentry.captureException(err, { extra: { requestId, route: '/api/chat' } });
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
    },
  });
}
