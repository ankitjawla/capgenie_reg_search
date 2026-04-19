// Web search client. Prefers Tavily (LLM-optimized, richer snippets),
// falls back to SerpAPI's Bing engine if TAVILY_API_KEY is unset.
//
// The file is still named bing.ts for historic reasons — upstream is
// whichever provider has a key.

export interface BingSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchError extends Error {
  status?: number;
  kind: 'auth' | 'rate_limit' | 'network' | 'unknown';
}

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';
const SERPAPI_ENDPOINT_DEFAULT = 'https://serpapi.com/search';
const SERPAPI_ENGINE = 'bing';

export async function bingWebSearch(
  query: string,
  count = Number(process.env.BING_SEARCH_RESULTS_PER_QUERY ?? 5),
): Promise<BingSearchResult[]> {
  if (process.env.TAVILY_API_KEY) {
    return tavilySearch(query, count);
  }
  return serpapiSearch(query, count);
}

// ---- Tavily ---------------------------------------------------------------

async function tavilySearch(query: string, count: number): Promise<BingSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY!;
  let res: Response;
  try {
    res = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: count,
        // "advanced" returns longer chunks (~2000 chars/result) at 2 credits
        // per search; "basic" is 1 credit with shorter snippets.
        search_depth: 'advanced',
        include_answer: false,
        include_raw_content: false,
      }),
    });
  } catch (e) {
    throw Object.assign(new Error(`Tavily network error: ${(e as Error).message}`), {
      kind: 'network' as const,
      cause: e,
    });
  }

  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error('Tavily API key is invalid or disabled.'), {
      kind: 'auth' as const,
      status: res.status,
    });
  }
  if (res.status === 429) {
    throw Object.assign(new Error('Tavily rate limit hit.'), {
      kind: 'rate_limit' as const,
      status: 429,
    });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`Tavily returned ${res.status}: ${body.slice(0, 200)}`), {
      kind: 'unknown' as const,
      status: res.status,
    });
  }

  const json = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
    error?: string;
  };
  if (json.error) {
    throw Object.assign(new Error(`Tavily: ${json.error}`), {
      kind: 'unknown' as const,
    });
  }
  return (json.results ?? [])
    .filter((r) => r.url)
    .slice(0, count)
    .map((r) => ({
      title: r.title ?? '',
      url: r.url!,
      // Tavily's `content` field is pre-extracted main-text, not a short
      // snippet — far more useful for an agent than a Bing/Serp description.
      snippet: (r.content ?? '').slice(0, 1500),
    }));
}

// ---- SerpAPI (Bing engine) fallback --------------------------------------

async function serpapiSearch(query: string, count: number): Promise<BingSearchResult[]> {
  const apiKey = process.env.SERPAPI_KEY ?? process.env.BING_SEARCH_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('No web-search API key configured. Set TAVILY_API_KEY or SERPAPI_KEY.'),
      { kind: 'auth' as const },
    );
  }
  const endpoint =
    process.env.SERPAPI_ENDPOINT ??
    process.env.BING_SEARCH_ENDPOINT ??
    SERPAPI_ENDPOINT_DEFAULT;
  const url = new URL(endpoint);
  if (!url.searchParams.has('engine')) url.searchParams.set('engine', SERPAPI_ENGINE);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(count));

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (e) {
    throw Object.assign(new Error(`SerpAPI network error: ${(e as Error).message}`), {
      kind: 'network' as const,
      cause: e,
    });
  }
  if (res.status === 401 || res.status === 403) {
    throw Object.assign(new Error('SerpAPI key is invalid or disabled.'), {
      kind: 'auth' as const,
      status: res.status,
    });
  }
  if (res.status === 429) {
    throw Object.assign(new Error('SerpAPI rate limit hit.'), {
      kind: 'rate_limit' as const,
      status: 429,
    });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`SerpAPI returned ${res.status}: ${body.slice(0, 200)}`), {
      kind: 'unknown' as const,
      status: res.status,
    });
  }
  const json = (await res.json()) as {
    organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
    error?: string;
  };
  if (json.error) {
    throw Object.assign(new Error(`SerpAPI: ${json.error}`), {
      kind: json.error.toLowerCase().includes('key') ? ('auth' as const) : ('unknown' as const),
    });
  }
  return (json.organic_results ?? [])
    .filter((v) => v.link)
    .slice(0, count)
    .map((v) => ({
      title: v.title ?? '',
      url: v.link!,
      snippet: v.snippet ?? '',
    }));
}
