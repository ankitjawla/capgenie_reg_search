// LangChain tool wrappers for the deep-agent graph.

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { bingWebSearch } from '../bing';
import type { SearchStep } from '../types';

// ---- web_search -----------------------------------------------------------

const webSearchInputSchema = z.object({
  query: z.string().describe('The Bing search query (plain English, not site: filters).'),
});

/**
 * Build a web_search tool bound to a trace accumulator so every query + result
 * is captured for the UI's "research transcript".
 */
export function makeWebSearchTool(trace: SearchStep[], agentLabel = 'researcher') {
  return tool(
    async (input) => {
      const { query } = input as z.infer<typeof webSearchInputSchema>;
      try {
        const results = await bingWebSearch(query);
        trace.push({ query, agent: agentLabel, results });
        // Compact payload so the model doesn't spend tokens on noise.
        return JSON.stringify(
          results.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet })),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Bing search failed.';
        trace.push({ query, agent: agentLabel, results: [] });
        return JSON.stringify({ error: message });
      }
    },
    {
      name: 'web_search',
      description:
        'Search the web via Bing. Use focused, primary-source-oriented queries (regulator sites, annual reports, investor relations pages). Avoid repeating the same query twice.',
      schema: webSearchInputSchema,
    },
  );
}

// ---- BankProfile structured output schema --------------------------------

const jurisdictionEnum = z.enum(['US', 'UK', 'EU', 'IN']);

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
  hqCountry: z
    .string()
    .describe("ISO 3166-1 alpha-2 country code of the bank's headquarters.")
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
