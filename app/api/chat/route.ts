// Follow-up Q&A over the already-researched profile. Closed-book: the
// agent has no web_search tool here — it must answer strictly from the
// profile + reports + rationale provided in the request body.

import { AzureChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import type { BankProfile, ReportRecommendation } from '@/lib/types';
import { classifyLLMError } from '@/lib/errors';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Body {
  profile: BankProfile;
  reports: ReportRecommendation[];
  history: ChatMessage[];
  question: string;
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
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.profile || !Array.isArray(body?.reports) || !body?.question?.trim()) {
    return Response.json(
      { error: 'profile, reports[], and question are required.' },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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

        // See lib/agent/graph.ts — LangChain uses the `model` string to pick
        // between `max_tokens` and `max_completion_tokens`; we pass the
        // deployment as the model so GPT-5 / o-series deployments work.
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

        const llmStream = await llm.stream(messages);
        for await (const chunk of llmStream) {
          const content = chunk?.content;
          if (typeof content === 'string' && content.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', delta: content })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      } catch (err) {
        console.error('chat route error', err);
        const [payload] = classifyLLMError(err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', error: payload.error, kind: payload.kind })}\n\n`,
          ),
        );
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
