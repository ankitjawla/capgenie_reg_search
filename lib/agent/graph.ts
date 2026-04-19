// Multi-node LangGraph deep-agent.
//
// Architecture (restored from the original plan):
//
//   START
//     → planner           (lists jurisdictions to probe, writes identity notes)
//     → researchUS / researchUK / researchEU / researchIN   (parallel sub-agents,
//       each a createReactAgent with the web_search tool, scoped to one
//       jurisdiction — skips itself if not in jurisdictionsToProbe)
//     → verifier          (cross-checks the findings against fresh searches;
//       routes back to one researcher if inconsistent, max 1 retry)
//     → synthesizer       (ReAct agent with responseFormat, produces the
//       structured BankProfile)
//     → END
//
// This moves verification from a prompt-level hope to a graph-level gate,
// and forces per-jurisdiction coverage instead of the single-loop agent's
// tendency to stop after finding the home jurisdiction.

import { AzureChatOpenAI } from '@langchain/openai';
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { bankProfileSchema, makeWebSearchTool } from './tools';
import type { BankProfile, Jurisdiction, SearchStep } from '../types';

const ALL_JURISDICTIONS: Jurisdiction[] = ['US', 'UK', 'EU', 'IN', 'CA', 'SG', 'HK'];

export interface DeepAgentOptions {
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
  trace: SearchStep[];
}

function makeLLM(opts: DeepAgentOptions): AzureChatOpenAI {
  const apiKey = opts.apiKey ?? process.env.AZURE_OPENAI_API_KEY;
  const endpoint = opts.endpoint ?? process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = opts.deployment ?? process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = opts.apiVersion ?? process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
  if (!apiKey || !endpoint || !deployment) {
    throw new Error(
      'Azure OpenAI is not fully configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT in your .env.local.',
    );
  }
  return new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIEndpoint: endpoint,
    azureOpenAIApiDeploymentName: deployment,
    azureOpenAIApiVersion: apiVersion,
    model: deployment,
    maxCompletionTokens: 4096,
    streaming: true,
  });
}

// --- State -----------------------------------------------------------------

const AgentState = Annotation.Root({
  bankName: Annotation<string>(),
  identityNotes: Annotation<string>({
    reducer: (_prev, next) => next ?? '',
    default: () => '',
  }),
  entityType: Annotation<'bank' | 'insurer' | 'crypto_firm'>({
    reducer: (_prev, next) => next ?? 'bank',
    default: () => 'bank',
  }),
  jurisdictionsToProbe: Annotation<Jurisdiction[]>({
    reducer: (_prev, next) => next ?? [],
    default: () => [],
  }),
  findings: Annotation<Partial<Record<Jurisdiction, string>>>({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
  verifierReport: Annotation<string>({
    reducer: (_prev, next) => next ?? '',
    default: () => '',
  }),
  retryJurisdiction: Annotation<Jurisdiction | null>({
    reducer: (_prev, next) => (next === undefined ? null : next),
    default: () => null,
  }),
  attempts: Annotation<number>({
    reducer: (prev, next) => (next ?? 0) + (prev ?? 0),
    default: () => 0,
  }),
  profile: Annotation<BankProfile | null>({
    reducer: (_prev, next) => next ?? null,
    default: () => null,
  }),
});

type State = typeof AgentState.State;

// --- Planner ---------------------------------------------------------------

const plannerSchema = z.object({
  identityNotes: z
    .string()
    .describe('3-5 sentences resolving the entity identity and flagging ambiguity.'),
  entityType: z
    .enum(['bank', 'insurer', 'crypto_firm'])
    .describe(
      'Forks the rules engine. "bank" for commercial / investment / holding-company banks (default). "insurer" for life / P&C / reinsurers. "crypto_firm" for exchanges / custodians / stablecoin issuers.',
    ),
  jurisdictionsToProbe: z
    .array(z.enum(['US', 'UK', 'EU', 'IN', 'CA', 'SG', 'HK']))
    .describe(
      'Which jurisdictions to investigate. Default to [US, UK, EU, IN, CA, SG, HK] unless the entity is clearly scoped to fewer. Only exclude a jurisdiction when you are confident there is no regulated presence there.',
    ),
});

const PLANNER_PROMPT = `You are the planner of a deep regulatory-research agent. Given an entity name, do three things:

1. Resolve the identity. In 3-5 sentences, name the most likely legal entity, note any name-collision risk, and spell out the home country.
2. Determine the entity type: "bank" (commercial / investment / holding-company / foreign branch), "insurer" (life / P&C / reinsurer), or "crypto_firm" (crypto exchange / custodian / stablecoin issuer). If the name is ambiguous, prefer the larger / more prominent entity. Default to "bank" when uncertain.
3. Choose jurisdictions to probe. Return a subset of [US, UK, EU, IN, CA, SG, HK]. Be generous — ALWAYS include the home jurisdiction + any jurisdictions commonly hosting foreign branches/subsidiaries for entities of this type. For large multinational firms default to all seven. Only exclude a jurisdiction if you are confident there is no regulated presence there.

Do not invoke any tools. Output only the structured plan.`;

async function plannerNode(state: State, llm: AzureChatOpenAI): Promise<Partial<State>> {
  const structured = llm.withStructuredOutput(plannerSchema, { strict: false });
  const result = await structured.invoke([
    new SystemMessage(PLANNER_PROMPT),
    new HumanMessage(`Bank name: "${state.bankName}". Output the plan.`),
  ]);
  return {
    identityNotes: result.identityNotes,
    entityType: result.entityType,
    jurisdictionsToProbe: result.jurisdictionsToProbe,
  };
}

// --- Researcher (factory — one per jurisdiction) ---------------------------

const RESEARCHER_PROMPT = (j: Jurisdiction, identityNotes: string, bankName: string) => `You are the ${j}-jurisdiction researcher for a deep regulatory-research agent.

Bank under investigation: "${bankName}".
Planner's identity notes: ${identityNotes}

Your job: determine whether this bank has a regulated presence in ${j} and, if so, gather the facts a regulator would care about.

Steps:
1. Run 2-4 focused web_search queries to investigate ${j} presence. Prefer primary sources — regulator registries (FDIC / FRB / OCC / PRA / ECB / RBI), the bank's annual report, and investor-relations pages.
2. If you find regulated presence in ${j}, note:
   - Entity type (subsidiary IHC, foreign branch / FBO, commercial bank, bank holding company, etc.)
   - Approximate assets in ${j} in USD billions
   - Any ${j}-specific designations (FDIC insured, D-SIB, G-SIB, FBO branch vs IHC, PRA/FCA dual-regulated, etc.)
3. If you do NOT find regulated presence in ${j}, say so explicitly — don't invent one.

Respond with a structured plain-text report (no markdown). Include the URLs of the sources you used inline. Your report will be fed into the verifier.`;

function makeResearcherNode(
  jur: Jurisdiction,
  trace: SearchStep[],
  llm: AzureChatOpenAI,
) {
  return async (state: State): Promise<Partial<State>> => {
    if (!state.jurisdictionsToProbe.includes(jur)) {
      return { findings: { [jur]: '(not probed — planner excluded this jurisdiction)' } };
    }
    const webSearch = makeWebSearchTool(trace, `researcher-${jur}`);
    const subAgent = createReactAgent({
      llm,
      tools: [webSearch],
      prompt: RESEARCHER_PROMPT(jur, state.identityNotes, state.bankName),
    });
    const result = await subAgent.invoke(
      {
        messages: [
          new HumanMessage(`Begin your ${jur}-presence research for "${state.bankName}" now.`),
        ],
      },
      { recursionLimit: 12 },
    );
    const last = result.messages[result.messages.length - 1];
    const text = typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content ?? '');
    return { findings: { [jur]: text } };
  };
}

// --- Verifier --------------------------------------------------------------

const verifierSchema = z.object({
  report: z.string().describe(
    'A 3-8 sentence summary of what you verified, what you couldn\'t verify, and any discrepancies between researcher reports.',
  ),
  retryJurisdiction: z
    .enum(['US', 'UK', 'EU', 'IN'])
    .nullable()
    .describe(
      'If one specific jurisdiction\'s findings are internally inconsistent, uncited, or clearly wrong, name it here and the graph will re-run that researcher. Otherwise null.',
    ),
});

const VERIFIER_PROMPT = `You are the verifier of a deep regulatory-research agent. Read the researcher reports from each jurisdiction and the planner's identity notes. Your job:

1. Check that the basic facts are internally consistent across reports: global assets, parent country, entity structures, G-SIB / D-SIB designations.
2. If TWO or more jurisdictions both claim to be the "home" of the parent, flag it.
3. If a report cites NO sources or clearly invented facts (e.g. numbers with no URL), flag it.
4. If one jurisdiction's report is so unreliable that the synthesizer shouldn't trust it, output that jurisdiction in retryJurisdiction. We will re-run that researcher ONCE — use this sparingly.

Do not invoke tools. Just read the reports and decide.`;

async function verifierNode(state: State, llm: AzureChatOpenAI): Promise<Partial<State>> {
  const structured = llm.withStructuredOutput(verifierSchema, { strict: false });
  const findingsBlock = (Object.keys(state.findings) as Jurisdiction[])
    .map((j) => `=== ${j} ===\n${state.findings[j]}\n`)
    .join('\n');
  const result = await structured.invoke([
    new SystemMessage(VERIFIER_PROMPT),
    new HumanMessage(
      `Bank: "${state.bankName}"\nPlanner identity notes: ${state.identityNotes}\n\nResearcher reports:\n${findingsBlock}`,
    ),
  ]);
  // We only allow ONE retry total (attempts starts at 0).
  const allowRetry = state.attempts < 1 && result.retryJurisdiction != null;
  return {
    verifierReport: result.report,
    retryJurisdiction: allowRetry ? result.retryJurisdiction : null,
    attempts: allowRetry ? 1 : 0,
  };
}

// --- Synthesizer -----------------------------------------------------------

const SYNTHESIZER_PROMPT = `You are the synthesizer of a deep regulatory-research agent. You have been handed researcher reports from each jurisdiction, a planner's identity notes, and a verifier's critique.

Produce the final structured BankProfile.

Rules:
- Jurisdiction codes: "US", "UK", "EU" (any EU member state), "IN" (India). Omit jurisdictions with no regulated presence.
- Convert all asset figures to USD billions.
- isFBO = true ONLY when the US presence is a branch/agency of a non-US parent (no separate US subsidiary / IHC).
- The "rationale" field MUST be 6-12 sentences. Explain how you resolved each major classification and flag any remaining uncertainty.
- Cite ≥ 3 distinct source URLs in the "sources" array, drawn from the researcher reports. Prefer primary sources (regulators, annual reports, investor-relations pages).
- If a field wasn't determined, emit null (NOT a guess).`;

async function synthesizerNode(state: State, llm: AzureChatOpenAI): Promise<Partial<State>> {
  const structured = llm.withStructuredOutput(bankProfileSchema, { strict: false });
  const findingsBlock = (Object.keys(state.findings) as Jurisdiction[])
    .map((j) => `=== ${j} ===\n${state.findings[j]}\n`)
    .join('\n');
  const profile = (await structured.invoke([
    new SystemMessage(SYNTHESIZER_PROMPT),
    new HumanMessage(
      `Bank: "${state.bankName}"

Planner identity notes:
${state.identityNotes}

Researcher reports:
${findingsBlock}

Verifier critique:
${state.verifierReport}

Emit the final BankProfile now.`,
    ),
  ])) as BankProfile;
  return { profile };
}

// --- Graph -----------------------------------------------------------------

export function buildDeepAgent(opts: DeepAgentOptions) {
  const llm = makeLLM(opts);

  // StateGraph's chaining API widens the node-name union on each addNode,
  // so we must build the graph in one expression — assigning it to a
  // `const` mid-chain freezes the type at `__start__` only.
  const compiled = new StateGraph(AgentState)
    .addNode('planner', (s) => plannerNode(s, llm))
    .addNode('researchUS', makeResearcherNode('US', opts.trace, llm))
    .addNode('researchUK', makeResearcherNode('UK', opts.trace, llm))
    .addNode('researchEU', makeResearcherNode('EU', opts.trace, llm))
    .addNode('researchIN', makeResearcherNode('IN', opts.trace, llm))
    .addNode('researchCA', makeResearcherNode('CA', opts.trace, llm))
    .addNode('researchSG', makeResearcherNode('SG', opts.trace, llm))
    .addNode('researchHK', makeResearcherNode('HK', opts.trace, llm))
    .addNode('verifier', (s) => verifierNode(s, llm))
    .addNode('synthesizer', (s) => synthesizerNode(s, llm))
    // Planner fans out to every researcher in parallel. Researchers for
    // excluded jurisdictions short-circuit themselves, so we don't waste
    // tokens on regions the planner ruled out.
    .addEdge(START, 'planner')
    .addEdge('planner', 'researchUS')
    .addEdge('planner', 'researchUK')
    .addEdge('planner', 'researchEU')
    .addEdge('planner', 'researchIN')
    .addEdge('planner', 'researchCA')
    .addEdge('planner', 'researchSG')
    .addEdge('planner', 'researchHK')
    // All seven researchers must complete before the verifier runs
    // (LangGraph auto-barrier on multiple incoming edges).
    .addEdge('researchUS', 'verifier')
    .addEdge('researchUK', 'verifier')
    .addEdge('researchEU', 'verifier')
    .addEdge('researchIN', 'verifier')
    .addEdge('researchCA', 'verifier')
    .addEdge('researchSG', 'verifier')
    .addEdge('researchHK', 'verifier')
    // Verifier either routes back to a single researcher for one retry, or
    // forward to the synthesizer.
    .addConditionalEdges(
      'verifier',
      (
        s,
      ):
        | 'researchUS'
        | 'researchUK'
        | 'researchEU'
        | 'researchIN'
        | 'researchCA'
        | 'researchSG'
        | 'researchHK'
        | 'synthesizer' => {
        if (s.retryJurisdiction) return `research${s.retryJurisdiction}` as const;
        return 'synthesizer';
      },
      [
        'researchUS',
        'researchUK',
        'researchEU',
        'researchIN',
        'researchCA',
        'researchSG',
        'researchHK',
        'synthesizer',
      ],
    )
    .addEdge('synthesizer', END)
    .compile();

  return compiled;
}

// Keep ALL_JURISDICTIONS exported for any caller that wants the list.
export { ALL_JURISDICTIONS };
export type { BaseMessage, AIMessage };
