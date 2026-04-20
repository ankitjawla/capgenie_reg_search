// Evidence-citation pass.
//
// Runs AFTER the deep-agent has produced a BankProfile and after
// applyRules has produced a ReportRecommendation[]. One Azure OpenAI call
// per analysis — not a graph node — that annotates each recommendation
// with a citation pointing back to one of the researcher's sources.
//
// Design decisions:
// - Runs once per analysis, not per report, so cost is bounded.
// - Uses structured output (Zod schema) — reliable parsing.
// - If the call fails, we still return the reports without citations and
//   the hallucination-guardrail path in the route demotes confidence as
//   before. Evidence-citation is additive, never destructive.

import { AzureChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';
import type { BankProfile, ReportRecommendation } from '../types';
import { logJson } from '../errors';

const citationItemSchema = z.object({
  reportId: z.string(),
  sourceUrl: z.string().describe('A URL from the profile.sources list; use "" if no good citation exists.'),
  sourceTitle: z.string().nullable().optional(),
  regulationSection: z
    .string()
    .nullable()
    .optional()
    .describe('The regulation section or citation if known (e.g. "12 CFR §208.5", "CRR Article 430"). Null if not clear from sources.'),
  quote: z
    .string()
    .nullable()
    .optional()
    .describe('A short verbatim snippet (≤ 20 words) from the source that supports the applicability of this report. Null if no direct snippet.'),
});

const citationBundleSchema = z.object({
  citations: z.array(citationItemSchema),
});

export interface AnnotateOptions {
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
  signal?: AbortSignal;
  requestId?: string;
}

/**
 * Annotate each `ReportRecommendation` with a citation pointing back to
 * one of `profile.sources`. Returns the same array with `citation` filled
 * in where the model found a match. Never throws — on failure returns the
 * input untouched.
 */
export async function annotateWithEvidence(
  profile: BankProfile,
  reports: ReportRecommendation[],
  opts: AnnotateOptions = {},
): Promise<ReportRecommendation[]> {
  if (reports.length === 0 || !(profile.sources?.length)) return reports;

  const apiKey = opts.apiKey ?? process.env.AZURE_OPENAI_API_KEY;
  const endpoint = opts.endpoint ?? process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = opts.deployment ?? process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = opts.apiVersion ?? process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
  if (!apiKey || !endpoint || !deployment) return reports;

  const started = Date.now();
  try {
    const llm = new AzureChatOpenAI({
      azureOpenAIApiKey: apiKey,
      azureOpenAIEndpoint: endpoint,
      azureOpenAIApiDeploymentName: deployment,
      azureOpenAIApiVersion: apiVersion,
      model: deployment,
      maxCompletionTokens: 2048,
    });
    const structured = llm.withStructuredOutput(citationBundleSchema, { strict: false });
    const reportsBlock = reports
      .map(
        (r) =>
          `- ${r.id} [${r.jurisdiction}] ${r.shortName} (${r.regulator}): ${r.applicabilityReason}`,
      )
      .join('\n');
    const sourcesBlock = profile.sources
      .map((s, i) => `[${i + 1}] ${s.title ?? '(untitled)'} — ${s.url}`)
      .join('\n');

    const prompt = `You are the evidence-citer for a bank regulatory-report advisor.

You are given:
1. A list of regulatory reports the rules engine says the bank should file.
2. The sources the research agent cited when classifying the bank.

For each report, pick the ONE source URL from the list that most directly
supports "this bank must file this report", and note the regulation
section (e.g. "12 CFR §208.5") if you can confidently infer it from the
source title or regulator. If NO source is a good fit for a given report,
emit that report with \`sourceUrl: ""\` (empty string) — do NOT invent.

Output strict JSON matching the schema. Do NOT include URLs that aren't
in the provided source list.

---
REPORTS (${reports.length}):
${reportsBlock}

SOURCES CITED BY THE RESEARCH AGENT:
${sourcesBlock}

BANK: ${profile.legalName} (${profile.hqCountry ?? '?'})
`;

    const result = await structured.invoke([new SystemMessage(prompt), new HumanMessage('Emit the citation bundle now.')], {
      signal: opts.signal,
    });

    const byId = new Map(result.citations.map((c) => [c.reportId, c]));
    const annotated = reports.map((r) => {
      const c = byId.get(r.id);
      if (!c || !c.sourceUrl) return r;
      return {
        ...r,
        citation: {
          sourceUrl: c.sourceUrl,
          sourceTitle: c.sourceTitle ?? undefined,
          regulationSection: c.regulationSection ?? undefined,
          quote: c.quote ?? undefined,
        },
      };
    });

    logJson({
      level: 'info',
      requestId: opts.requestId,
      route: 'agent.evidence',
      msg: 'evidence.cited',
      durationMs: Date.now() - started,
      total: reports.length,
      cited: annotated.filter((r) => r.citation).length,
    });
    return annotated;
  } catch (err) {
    logJson({
      level: 'warn',
      requestId: opts.requestId,
      route: 'agent.evidence',
      msg: 'evidence.failed',
      durationMs: Date.now() - started,
      err: (err as Error).message,
    });
    return reports;
  }
}
