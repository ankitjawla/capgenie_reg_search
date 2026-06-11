// Quantitative compliance-burden score.
//
// Per-report weight = frequency-weight × jurisdiction-complexity ×
//                     confidence-multiplier. Aggregated to a 0-100 score.
//
// This is opinionated and intentionally simple. It's a sortable comparison
// metric, not a regulatory benchmark — its only job is to make "Bank A is
// objectively more compliance-heavy than Bank B" defensible.

import type { ReportRecommendation, ReportFrequency, Jurisdiction } from './types';

// Annual "files per year" weight per frequency. Higher = more burden.
const FREQUENCY_WEIGHT: Record<ReportFrequency, number> = {
  daily: 250,
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  semi_annual: 2,
  annual: 1,
  event_driven: 6, // amortized assumption
  ad_hoc: 2,
};

// Per-jurisdiction complexity multiplier (judgement call, documented).
const JURISDICTION_MULTIPLIER: Record<Jurisdiction, number> = {
  US: 1.4, // most fragmented, FFIEC + Fed + FDIC + OCC + state
  EU: 1.3, // CRR + multiple ESAs
  UK: 1.2,
  IN: 1.1,
  HK: 1.0,
  SG: 1.0,
  CA: 1.0,
};

const CONFIDENCE_MULTIPLIER: Record<ReportRecommendation['confidence'], number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
};

export interface RiskScore {
  score: number; // 0-100 normalized
  rawTotal: number;
  topContributors: Array<{ id: string; shortName: string; contribution: number }>;
  cadenceCounts: Record<ReportFrequency, number>;
}

export function computeRiskScore(reports: ReportRecommendation[]): RiskScore {
  let rawTotal = 0;
  const contribs: Array<{ id: string; shortName: string; contribution: number }> = [];
  const cadence = {} as Record<ReportFrequency, number>;
  for (const r of reports) {
    const w =
      (FREQUENCY_WEIGHT[r.frequency] ?? 1) *
      (JURISDICTION_MULTIPLIER[r.jurisdiction] ?? 1) *
      (CONFIDENCE_MULTIPLIER[r.confidence] ?? 1);
    rawTotal += w;
    contribs.push({ id: r.id, shortName: r.shortName, contribution: w });
    cadence[r.frequency] = (cadence[r.frequency] ?? 0) + 1;
  }
  contribs.sort((a, b) => b.contribution - a.contribution);
  // Normalize to 0-100 against a rough "very heavy multinational" reference
  // of 1500 filings/year × 1.3 average multiplier ≈ 1950.
  const score = Math.min(100, Math.round((rawTotal / 1950) * 100));
  return {
    score,
    rawTotal: Math.round(rawTotal),
    topContributors: contribs.slice(0, 5),
    cadenceCounts: cadence,
  };
}

export function scoreLabel(score: number): { label: string; tone: 'low' | 'mid' | 'high' } {
  if (score < 25) return { label: 'Light', tone: 'low' };
  if (score < 60) return { label: 'Moderate', tone: 'mid' };
  return { label: 'Heavy', tone: 'high' };
}
