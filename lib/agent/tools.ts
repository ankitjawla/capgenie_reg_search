// LangChain tool wrappers for the deep-agent graph.

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { bingWebSearch } from '../bing';
import type { SearchStep } from '../types';

// ---- web_search -----------------------------------------------------------

const webSearchInputSchema = z.object({
  query: z.string().describe('The Bing search query (plain English, not site: filters).'),
});

export interface WebSearchToolOpts {
  trace: SearchStep[];
  agentLabel?: string;
  // Shared cache across all researcher nodes in one run so the same query
  // fired by US-researcher and EU-researcher only costs one Tavily credit.
  searchCache?: Map<string, Awaited<ReturnType<typeof bingWebSearch>>>;
  signal?: AbortSignal;
}

/**
 * Build a web_search tool bound to a trace accumulator + optional shared
 * query cache. Every query + result is captured for the UI's
 * "research transcript".
 */
export function makeWebSearchTool(opts: WebSearchToolOpts) {
  const { trace, agentLabel = 'researcher', searchCache, signal } = opts;
  return tool(
    async (input) => {
      const { query } = input as z.infer<typeof webSearchInputSchema>;
      const normalized = query.trim().toLowerCase();
      try {
        // Per-run cross-jurisdiction dedup: identical queries don't re-hit
        // Tavily. Tag the trace entry so the UI can still see a researcher
        // "ran" the query.
        let results = searchCache?.get(normalized);
        if (results) {
          trace.push({ query, agent: `${agentLabel} (cache)`, results });
        } else {
          results = await bingWebSearch(query, { signal });
          searchCache?.set(normalized, results);
          trace.push({ query, agent: agentLabel, results });
        }
        return JSON.stringify(
          results.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet })),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Web search failed.';
        trace.push({ query, agent: agentLabel, results: [] });
        return JSON.stringify({ error: message });
      }
    },
    {
      name: 'web_search',
      description:
        'Search the web. Use focused, primary-source-oriented queries (regulator sites, annual reports, investor relations pages). Avoid repeating the same query twice — results are cached across researchers within a run.',
      schema: webSearchInputSchema,
    },
  );
}

// ---- BankProfile structured output schema --------------------------------

const jurisdictionEnum = z.enum(['US', 'UK', 'EU', 'IN', 'CA', 'SG', 'HK']);

const entityTypeEnum = z.enum(['bank', 'insurer', 'crypto_firm']);

const bankCategoryEnum = z.enum([
  'commercial_bank',
  'investment_bank',
  'savings_bank',
  'credit_union',
  'cooperative_bank',
  'foreign_branch',
  'bank_holding_company',
  'small_finance_bank',
  'payments_bank',
  'nbfc',
  'building_society',
  'life_insurer',
  'property_casualty_insurer',
  'reinsurer',
  'crypto_exchange',
  'crypto_custodian',
  'stablecoin_issuer',
  'other',
]);

const assetSizeTierEnum = z.enum([
  'lt_1B',
  '1B_to_10B',
  '10B_to_50B',
  '50B_to_100B',
  '100B_to_250B',
  '250B_to_700B',
  'gt_700B',
  'unknown',
]);

const activityEnum = z.enum([
  'retail_deposits',
  'commercial_lending',
  'mortgage_lending',
  'credit_cards',
  'derivatives_trading',
  'securities_underwriting',
  'broker_dealer',
  'asset_management',
  'custody_services',
  'cross_border_payments',
  'foreign_exchange',
  'trade_finance',
  'crypto_assets',
  'priority_sector_lending',
  'agriculture_lending',
]);

// All previously-optional fields use `.nullable()` instead of `.optional()`
// because OpenAI's strict structured-output mode requires every property to
// appear in `required`. The model emits explicit `null` when it doesn't know
// a value; our downstream code treats null identically to undefined.
export const bankProfileSchema = z.object({
  legalName: z.string(),
  commonName: z.string().nullable(),
  entityType: entityTypeEnum
    .describe('bank | insurer | crypto_firm — forks which rules engine runs.')
    .nullable(),
  hqCountry: z
    .string()
    .describe("ISO 3166-1 alpha-2 country code of the headquarters.")
    .nullable(),
  globalAssetsUsdB: z
    .number()
    .describe('Approximate global consolidated total assets in USD billions.')
    .nullable(),
  category: bankCategoryEnum,
  assetSizeTier: assetSizeTierEnum,
  isPubliclyListed: z.boolean().nullable(),
  isGSIB: z
    .boolean()
    .describe('True if designated a Global Systemically Important Bank by the FSB.')
    .nullable(),
  isDSIB: z
    .boolean()
    .describe('True if designated a Domestic SIB in any home jurisdiction.')
    .nullable(),
  isFDICInsured: z.boolean().nullable(),
  hasInsuranceSubsidiary: z.boolean().nullable(),
  hasBrokerDealerSubsidiary: z.boolean().nullable(),
  presence: z.array(
    z.object({
      jurisdiction: jurisdictionEnum,
      entityType: bankCategoryEnum,
      hasHoldingCompany: z.boolean().nullable(),
      isFBO: z
        .boolean()
        .describe(
          'True if operating as a Foreign Banking Organization branch/agency (US only, no IHC).',
        )
        .nullable(),
      jurisdictionAssetsUsdB: z.number().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  activities: z.array(activityEnum),
  rationale: z
    .string()
    .describe(
      'Detailed explanation (6-12 sentences). Cover: (1) how you resolved the bank identity and any name-collision risk; (2) what the asset size is based on and what period it reflects; (3) which jurisdictions you confirmed presence in and what evidence you used; (4) which G-SIB/D-SIB/FDIC/public listing designations apply; (5) any fields you remain uncertain about.',
    ),
  sources: z
    .array(
      z.object({
        title: z.string().nullable(),
        url: z.string(),
      }),
    )
    .describe(
      'At least 3 distinct source URLs cited in the rationale. Prefer regulator / annual report / investor-relations pages.',
    ),
});

export type BankProfileSchema = z.infer<typeof bankProfileSchema>;
