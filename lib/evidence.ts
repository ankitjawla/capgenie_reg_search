// Utilities for resolving a ReportRecommendation's evidenceFieldIds against a
// live BankProfile — used by the "Why this report?" drawer.

import type { BankProfile, Jurisdiction } from './types';

export interface EvidenceValue {
  fieldId: string;
  label: string;
  value: string;
}

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  IN: 'India',
};

const TIER_LABEL: Record<string, string> = {
  lt_1B: '< $1B',
  '1B_to_10B': '$1B – $10B',
  '10B_to_50B': '$10B – $50B',
  '50B_to_100B': '$50B – $100B',
  '100B_to_250B': '$100B – $250B',
  '250B_to_700B': '$250B – $700B',
  gt_700B: '> $700B',
  unknown: 'Unknown',
};

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function presenceLabel(profile: BankProfile, j: Jurisdiction): string {
  const p = profile.presence.find((x) => x.jurisdiction === j);
  if (!p) return 'No regulated presence';
  const bits = [humanize(p.entityType)];
  if (p.isFBO) bits.push('FBO');
  if (p.jurisdictionAssetsUsdB) bits.push(`~$${p.jurisdictionAssetsUsdB.toFixed(0)}B`);
  return bits.join(' · ');
}

export function resolveEvidence(
  profile: BankProfile,
  fieldIds: string[],
): EvidenceValue[] {
  const out: EvidenceValue[] = [];
  const seen = new Set<string>();

  for (const raw of fieldIds) {
    if (seen.has(raw)) continue;
    seen.add(raw);

    // presence.<JUR>
    const presenceMatch = raw.match(/^presence\.(US|UK|EU|IN)$/);
    if (presenceMatch) {
      const j = presenceMatch[1] as Jurisdiction;
      out.push({
        fieldId: raw,
        label: `${JURISDICTION_LABEL[j]} presence`,
        value: presenceLabel(profile, j),
      });
      continue;
    }

    // presence.<JUR>.entityType / isFBO / jurisdictionAssetsUsdB
    const subFieldMatch = raw.match(/^presence\.(US|UK|EU|IN)\.(\w+)$/);
    if (subFieldMatch) {
      const j = subFieldMatch[1] as Jurisdiction;
      const key = subFieldMatch[2];
      const p = profile.presence.find((x) => x.jurisdiction === j);
      if (!p) {
        out.push({ fieldId: raw, label: `${j} ${key}`, value: '—' });
      } else {
        const value = (p as unknown as Record<string, unknown>)[key];
        out.push({
          fieldId: raw,
          label: `${j} ${humanize(key)}`,
          value: value == null ? '—' : String(value),
        });
      }
      continue;
    }

    // activities.<activity>
    const activityMatch = raw.match(/^activities\.(\w+)$/);
    if (activityMatch) {
      const a = activityMatch[1];
      const has = profile.activities.includes(a as BankProfile['activities'][number]);
      out.push({
        fieldId: raw,
        label: humanize(a),
        value: has ? 'Yes' : 'No',
      });
      continue;
    }

    // Top-level scalar fields
    if (raw === 'assetSizeTier') {
      out.push({
        fieldId: raw,
        label: 'Asset size tier',
        value: TIER_LABEL[profile.assetSizeTier] ?? profile.assetSizeTier,
      });
      continue;
    }
    if (raw === 'globalAssetsUsdB') {
      out.push({
        fieldId: raw,
        label: 'Global assets (USD B)',
        value: profile.globalAssetsUsdB ? `~$${profile.globalAssetsUsdB.toFixed(0)}B` : '—',
      });
      continue;
    }
    const scalarKeys = [
      'isGSIB',
      'isDSIB',
      'isFDICInsured',
      'isPubliclyListed',
      'hasInsuranceSubsidiary',
      'hasBrokerDealerSubsidiary',
      'category',
      'hqCountry',
    ] as const;
    if ((scalarKeys as readonly string[]).includes(raw)) {
      const value = (profile as unknown as Record<string, unknown>)[raw];
      out.push({
        fieldId: raw,
        label: humanize(raw.replace(/^is/, '')),
        value: value == null ? '—' : String(value),
      });
      continue;
    }

    // Unknown — show the raw id.
    out.push({ fieldId: raw, label: raw, value: '—' });
  }

  return out;
}
