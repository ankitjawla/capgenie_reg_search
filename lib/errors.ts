// Centralized LLM + web-search error classification.
//
// LangChain passes underlying OpenAI errors through without wrapping, and
// the Bing client throws errors tagged with a `kind` field. This helper
// turns any of them into a consistent `{error, kind}` payload + HTTP status
// for API routes to return.

export type ErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'upstream'
  | 'bad_request'
  | 'network'
  | 'config'
  | 'internal';

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `r_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

export interface LogPayload {
  level: 'info' | 'warn' | 'error';
  requestId?: string;
  route?: string;
  msg: string;
  [k: string]: unknown;
}

export function logJson(p: LogPayload): void {
  // Vercel + most log shippers parse JSON lines automatically.
  const line = JSON.stringify({ ts: new Date().toISOString(), ...p });
  if (p.level === 'error') console.error(line);
  else if (p.level === 'warn') console.warn(line);
  else console.log(line);
}

export interface ErrorPayload {
  error: string;
  kind: ErrorKind;
}

export function classifyLLMError(err: unknown): [ErrorPayload, number] {
  if (!(err instanceof Error)) {
    return [{ error: 'Unknown error', kind: 'internal' }, 500];
  }

  const anyErr = err as Error & {
    status?: number;
    code?: string;
    kind?: ErrorKind;
    name?: string;
  };

  // Bing client errors carry a `kind` directly.
  if (anyErr.kind) {
    switch (anyErr.kind) {
      case 'auth':
        return [{ error: anyErr.message, kind: 'auth' }, 401];
      case 'rate_limit':
        return [{ error: anyErr.message, kind: 'rate_limit' }, 429];
      case 'network':
        return [{ error: anyErr.message, kind: 'network' }, 502];
      default:
        return [{ error: anyErr.message, kind: 'internal' }, 500];
    }
  }

  // Bank-profile extractor config check — misses Azure env vars.
  if (anyErr.message.includes('Azure OpenAI is not fully configured')) {
    return [{ error: anyErr.message, kind: 'config' }, 500];
  }
  if (anyErr.message.includes('BING_SEARCH_API_KEY is not set')) {
    return [{ error: anyErr.message, kind: 'config' }, 500];
  }

  // OpenAI SDK errors (bubble through LangChain). The SDK uses HTTP status
  // codes on the thrown error object.
  const status = anyErr.status;
  if (status === 401 || status === 403) {
    return [
      { error: 'Azure OpenAI authentication failed — check the API key and deployment name.', kind: 'auth' },
      401,
    ];
  }
  if (status === 429) {
    return [
      { error: 'Azure OpenAI rate limit hit. Wait a moment and retry.', kind: 'rate_limit' },
      429,
    ];
  }
  if (status === 400) {
    return [{ error: anyErr.message, kind: 'bad_request' }, 400];
  }
  if (status && status >= 500) {
    return [
      { error: 'Azure OpenAI is currently overloaded or unreachable. Retry in a minute.', kind: 'upstream' },
      503,
    ];
  }

  // Fallback: anything from LangGraph's structured response validation that
  // mentions a recursion limit or schema mismatch.
  if (anyErr.message.includes('recursion limit') || anyErr.message.includes('Recursion limit')) {
    return [
      { error: 'Agent exceeded its maximum research depth. Try again or narrow the bank name.', kind: 'internal' },
      500,
    ];
  }

  return [{ error: anyErr.message, kind: 'internal' }, 500];
}
