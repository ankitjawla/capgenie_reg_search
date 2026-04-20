// Pivots the catalog by regulator so the UI can browse regulator-first.
//
// Catalog entries have a free-form `regulator` string that may combine
// multiple regulators (e.g. "FFIEC / FRB / FDIC / OCC"). We canonicalize
// to the REGULATORS slug list and then group.

import { REPORT_CATALOG, type CatalogEntry } from './reports-catalog';
import { REGULATORS, findRegulatorBySlug, type RegulatorMeta } from './regulators';

export interface RegulatorBucket {
  regulator: RegulatorMeta;
  reports: CatalogEntry[];
}

/**
 * Canonicalize a catalog entry's `regulator` string to the list of slugs
 * it represents. A compound string like "FFIEC / FRB / FDIC / OCC" will
 * return ['ffiec', 'federal-reserve', 'fdic', 'occ'].
 */
export function canonicalizeRegulator(raw: string): string[] {
  const lower = raw.toLowerCase();
  const matched = new Set<string>();
  for (const r of REGULATORS) {
    for (const m of r.matchers) {
      if (lower.includes(m)) {
        matched.add(r.slug);
        break;
      }
    }
  }
  return [...matched];
}

/**
 * Group every catalog entry by every regulator that owns it. One entry can
 * appear under multiple buckets (Call Reports show up under FFIEC + FRB +
 * FDIC + OCC). Returns a stable-ordered list matching REGULATORS.
 */
export function groupByRegulator(): RegulatorBucket[] {
  const bySlug = new Map<string, CatalogEntry[]>();
  for (const entry of Object.values(REPORT_CATALOG)) {
    const slugs = canonicalizeRegulator(entry.regulator);
    if (slugs.length === 0) {
      // Unknown regulator — park under a synthetic "other" bucket.
      if (!bySlug.has('other')) bySlug.set('other', []);
      bySlug.get('other')!.push(entry);
      continue;
    }
    for (const s of slugs) {
      if (!bySlug.has(s)) bySlug.set(s, []);
      bySlug.get(s)!.push(entry);
    }
  }
  return REGULATORS.filter((r) => bySlug.has(r.slug)).map((r) => ({
    regulator: r,
    reports: (bySlug.get(r.slug) ?? []).sort((a, b) => a.shortName.localeCompare(b.shortName)),
  }));
}

export function reportsForRegulator(slug: string): CatalogEntry[] {
  const regulator = findRegulatorBySlug(slug);
  if (!regulator) return [];
  return Object.values(REPORT_CATALOG)
    .filter((entry) => canonicalizeRegulator(entry.regulator).includes(slug))
    .sort((a, b) => a.shortName.localeCompare(b.shortName));
}

export function regulatorsForReport(entry: CatalogEntry): RegulatorMeta[] {
  const slugs = canonicalizeRegulator(entry.regulator);
  return slugs
    .map((s) => findRegulatorBySlug(s))
    .filter((r): r is RegulatorMeta => !!r);
}
