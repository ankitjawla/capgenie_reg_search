// Helpers for the natural-language rules explainer.
//
// The follow-up chat can answer "why isn't FFIEC 101 here?" by showing the
// boolean trace of the rule rather than asking the LLM to reason from scratch.

import { REPORT_CATALOG } from './reports-catalog';
import { applyRules } from './rules';
import type { BankProfile } from './types';

export interface RuleExplanation {
  catalogId: string;
  shortName: string;
  jurisdiction: string;
  applies: boolean;
  reason: string;
  applicabilityReason?: string;
}

/**
 * Look up a report by its short or full name (case-insensitive substring).
 * Returns the catalog id if found.
 */
export function findCatalogIdByName(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const id of Object.keys(REPORT_CATALOG)) {
    const e = REPORT_CATALOG[id as keyof typeof REPORT_CATALOG];
    if (
      e.shortName.toLowerCase() === q ||
      e.fullName.toLowerCase() === q ||
      e.shortName.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q)
    ) {
      return id;
    }
  }
  return null;
}

/**
 * Run the rules engine against the profile and explain whether the named
 * report applies. Plain-English reason; designed to be embedded in a chat
 * answer rather than rendered as JSON.
 */
export function explainReport(
  query: string,
  profile: BankProfile,
): RuleExplanation | null {
  const id = findCatalogIdByName(query);
  if (!id) return null;
  const e = REPORT_CATALOG[id as keyof typeof REPORT_CATALOG];
  const reports = applyRules(profile);
  const match = reports.find((r) => r.id === id);
  if (match) {
    return {
      catalogId: id,
      shortName: e.shortName,
      jurisdiction: e.jurisdiction,
      applies: true,
      reason: `It applies because: ${match.applicabilityReason}`,
      applicabilityReason: match.applicabilityReason,
    };
  }
  // Not in the result list — synthesize a "why not" explanation.
  const presence = profile.presence.find((p) => p.jurisdiction === e.jurisdiction);
  const reasons: string[] = [];
  if (!presence) {
    reasons.push(
      `the rules engine sees no regulated presence in ${e.jurisdiction} on this profile`,
    );
  }
  if (e.jurisdiction === 'US' && presence) {
    if (presence.isFBO && id === 'US_FFIEC_031') {
      reasons.push('the US presence is an FBO branch, so FFIEC 002 applies instead of FFIEC 031');
    }
    if (id === 'US_FR_Y_14A') {
      reasons.push('FR Y-14A applies only to BHCs / IHCs with ≥ $100B in US assets');
    }
    if (id === 'US_FFIEC_101') {
      reasons.push(
        'FFIEC 101 applies to advanced-approaches institutions (≥ $250B or G-SIB)',
      );
    }
    if (id === 'US_HMDA_LAR' && !profile.activities.includes('mortgage_lending')) {
      reasons.push('HMDA LAR requires the bank to originate residential mortgages');
    }
    if (id === 'US_CRA' && !profile.isFDICInsured) {
      reasons.push('CRA data collection applies only to FDIC-insured institutions');
    }
  }
  if (reasons.length === 0) {
    reasons.push(
      `the catalog rule for ${e.shortName} did not match this profile — review the rule logic in lib/rules.ts`,
    );
  }
  return {
    catalogId: id,
    shortName: e.shortName,
    jurisdiction: e.jurisdiction,
    applies: false,
    reason: `Not in the recommended list because ${reasons.join('; ')}.`,
  };
}
