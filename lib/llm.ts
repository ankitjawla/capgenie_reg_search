// Thin adapter between the API routes and the multi-node LangGraph deep-agent.
// Streams events from the compiled graph and maps them into our stable
// {info, search, text} SSE shape so the UI doesn't need to care about the
// graph topology.

import { buildDeepAgent } from './agent/graph';
import type { AnalysisTrace, BankProfile, SearchStep } from './types';

export type StreamEvent =
  | { type: 'info'; message: string }
  | { type: 'search'; query: string }
  | { type: 'text'; delta: string };

export interface ExtractOptions {
  apiKey?: string;
  model?: string;
  maxWebSearches?: number;
  onEvent?: (evt: StreamEvent) => void;
  // Propagated from the HTTP request so all upstream calls (Azure, Tavily)
  // are cancelled when the user closes the tab.
  signal?: AbortSignal;
  // Correlation id so graph logs can be tied to the HTTP request.
  requestId?: string;
}

export interface ExtractResult {
  profile: BankProfile;
  trace: AnalysisTrace;
}

// Human-readable label per node name; used to emit `info` events when
// LangGraph fires `on_chain_start` for a node.
const NODE_LABELS: Record<string, string> = {
  planner: 'Planning jurisdictions and resolving entity identity…',
  researchUS: 'Researching United States presence…',
  researchUK: 'Researching United Kingdom presence…',
  researchEU: 'Researching European Union presence…',
  researchIN: 'Researching India presence…',
  researchCA: 'Researching Canada presence…',
  researchSG: 'Researching Singapore presence…',
  researchHK: 'Researching Hong Kong presence…',
  verifier: 'Cross-verifying findings across jurisdictions…',
  synthesizer: 'Synthesizing the verified profile…',
};

export async function extractBankProfile(
  bankName: string,
  opts: ExtractOptions = {},
): Promise<BankProfile> {
  const result = await extractBankProfileWithTrace(bankName, opts);
  return result.profile;
}

export async function extractBankProfileWithTrace(
  bankName: string,
  opts: ExtractOptions = {},
): Promise<ExtractResult> {
  const emit = opts.onEvent ?? (() => {});
  const trace: SearchStep[] = [];
  const started = Date.now();

  const agent = buildDeepAgent({
    trace,
    signal: opts.signal,
    requestId: opts.requestId,
  });

  emit({ type: 'info', message: `Starting deep-agent research on "${bankName}"…` });

  let assistantText = '';
  let finalProfile: BankProfile | undefined;
  let nodeTransitions = 0;

  const seenSearchQueries = new Set<string>();
  const seenNodes = new Set<string>();

  const stream = agent.streamEvents(
    { bankName },
    { version: 'v2', recursionLimit: 60, signal: opts.signal },
  );

  for await (const event of stream) {
    switch (event.event) {
      case 'on_chain_start': {
        const name = event.name ?? '';
        const label = NODE_LABELS[name];
        if (label && !seenNodes.has(name)) {
          // Researchers for excluded jurisdictions still fire but return
          // immediately — avoid spamming the UI for those by deferring the
          // decision to the node, not here. We emit once per unique node.
          seenNodes.add(name);
          nodeTransitions++;
          emit({ type: 'info', message: label });
        }
        break;
      }
      case 'on_tool_start': {
        const input = event.data?.input as { query?: string } | undefined;
        const query = input?.query;
        if (query && !seenSearchQueries.has(query)) {
          seenSearchQueries.add(query);
          emit({ type: 'search', query });
        }
        break;
      }
      case 'on_chat_model_stream': {
        const chunk = event.data?.chunk as { content?: unknown } | undefined;
        const content = chunk?.content;
        if (typeof content === 'string' && content.length > 0) {
          assistantText += content;
          emit({ type: 'text', delta: content });
        }
        break;
      }
      case 'on_chain_end': {
        // Capture the final graph output.
        const output = event.data?.output as { profile?: BankProfile } | undefined;
        if (output?.profile && !finalProfile) {
          finalProfile = output.profile;
        }
        break;
      }
      default:
        break;
    }
  }

  if (!finalProfile) {
    throw new Error('Deep agent did not produce a final BankProfile.');
  }

  emit({ type: 'info', message: 'Deep agent complete.' });

  return {
    profile: finalProfile,
    trace: {
      searches: trace,
      assistantText,
      turns: nodeTransitions,
      elapsedMs: Date.now() - started,
    },
  };
}
