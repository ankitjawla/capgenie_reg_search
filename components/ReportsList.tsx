'use client';

import { useMemo, useState } from 'react';
import type { BankProfile, ReportRecommendation, Jurisdiction } from '@/lib/types';
import { csvFilename, downloadCsv, reportsToCsv } from '@/lib/export';
import { resolveEvidence } from '@/lib/evidence';

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  IN: 'India',
};

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-annual',
  annual: 'Annual',
  event_driven: 'Event-driven',
  ad_hoc: 'Ad-hoc',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

const FREQUENCY_RANK: Record<string, number> = {
  daily: 1,
  weekly: 2,
  fortnightly: 3,
  monthly: 4,
  quarterly: 5,
  semi_annual: 6,
  annual: 7,
  event_driven: 8,
  ad_hoc: 9,
};

type GroupKey = 'jurisdiction' | 'frequency' | 'confidence' | 'regulator';
type SortKey = 'jurisdiction' | 'frequency' | 'confidence' | 'regulator';

type ConfidenceLevel = 'high' | 'medium' | 'low';

interface Props {
  reports: ReportRecommendation[];
  bankName?: string;
  profile?: BankProfile;
}

export default function ReportsList({ reports, bankName, profile }: Props) {
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<Record<ConfidenceLevel, boolean>>({
    high: true,
    medium: true,
    low: true,
  });
  const [groupBy, setGroupBy] = useState<GroupKey>('jurisdiction');
  const [sortBy, setSortBy] = useState<SortKey>('jurisdiction');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (!confidenceFilter[r.confidence]) return false;
      if (!q) return true;
      return (
        r.shortName.toLowerCase().includes(q) ||
        r.fullName.toLowerCase().includes(q) ||
        r.regulator.toLowerCase().includes(q)
      );
    });
  }, [reports, search, confidenceFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ReportRecommendation[]>();
    for (const r of filtered) {
      const key =
        groupBy === 'jurisdiction'
          ? r.jurisdiction
          : groupBy === 'frequency'
          ? r.frequency
          : groupBy === 'confidence'
          ? r.confidence
          : r.regulator;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }
    // Sort inside each group by sortBy.
    for (const list of groups.values()) {
      list.sort((a, b) => compareBy(a, b, sortBy));
    }
    return groups;
  }, [filtered, groupBy, sortBy]);

  function handleExport() {
    downloadCsv(csvFilename(bankName ?? 'report'), reportsToCsv(filtered));
  }

  if (reports.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        No regulatory reports matched for the jurisdictions covered. If the bank operates outside US/UK/EU/India,
        this tool does not yet cover those rules.
      </section>
    );
  }

  const groupOrder = groupOrderFor(groupBy, Array.from(grouped.keys()));

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search reports…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <div className="flex items-center gap-1 text-xs">
            {(['high', 'medium', 'low'] as ConfidenceLevel[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConfidenceFilter((f) => ({ ...f, [c]: !f[c] }))}
                className={`rounded-full border px-2 py-0.5 font-medium ${
                  confidenceFilter[c]
                    ? CONFIDENCE_STYLES[c] + ' border-transparent'
                    : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupKey)}
              className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="jurisdiction">Jurisdiction</option>
              <option value="frequency">Frequency</option>
              <option value="confidence">Confidence</option>
              <option value="regulator">Regulator</option>
            </select>
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Sort by
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="jurisdiction">Jurisdiction</option>
              <option value="frequency">Frequency</option>
              <option value="confidence">Confidence</option>
              <option value="regulator">Regulator</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Groups */}
      {groupOrder.map((key) => {
        const items = grouped.get(key);
        if (!items?.length) return null;
        return (
          <details
            key={key}
            open
            className="group rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <summary className="flex cursor-pointer list-none items-baseline justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {groupHeader(groupBy, key)}
              </h2>
              <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                {items.length} report{items.length === 1 ? '' : 's'}
                <span className="transition-transform group-open:rotate-180">▾</span>
              </span>
            </summary>
            <ul className="divide-y divide-slate-100 px-6 pb-6 dark:divide-slate-800">
              {items.map((r) => (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <ReportRow
                    report={r}
                    profile={profile}
                    expanded={expandedId === r.id}
                    onToggle={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                  />
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}

function ReportRow({
  report: r,
  profile,
  expanded,
  onToggle,
}: {
  report: ReportRecommendation;
  profile?: BankProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const evidence = profile ? resolveEvidence(profile, r.evidenceFieldIds) : [];
  const topSources = profile?.sources?.slice(0, 3) ?? [];
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{r.shortName}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{r.regulator}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.fullName}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.description}</p>
          <p className="mt-2 text-sm text-brand-700 dark:text-brand-400">
            <span className="font-medium">Why it applies:</span> {r.applicabilityReason}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {FREQ_LABEL[r.frequency] ?? r.frequency}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CONFIDENCE_STYLES[r.confidence]}`}>
            {r.confidence}
          </span>
          {r.referenceUrl && (
            <a
              href={r.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400"
            >
              reference
            </a>
          )}
        </div>
      </div>
      {profile && (
        <div className="mt-2">
          <button
            type="button"
            onClick={onToggle}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
          >
            {expanded ? 'Hide evidence' : 'Why this report?'}
          </button>
          {expanded && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
              {evidence.length > 0 && (
                <div>
                  <div className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Profile fields that triggered this rule
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {evidence.map((e) => (
                      <li key={e.fieldId} className="flex gap-2">
                        <span className="text-slate-500 dark:text-slate-400">{e.label}:</span>
                        <span className="font-medium">{e.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {topSources.length > 0 && (
                <div className="mt-3">
                  <div className="font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Sources the research agent cited
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {topSources.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400"
                        >
                          {s.title ?? s.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------- helpers ----------------

function compareBy(a: ReportRecommendation, b: ReportRecommendation, key: SortKey): number {
  switch (key) {
    case 'jurisdiction':
      return jurisdictionOrder(a.jurisdiction) - jurisdictionOrder(b.jurisdiction);
    case 'frequency':
      return (FREQUENCY_RANK[a.frequency] ?? 99) - (FREQUENCY_RANK[b.frequency] ?? 99);
    case 'confidence':
      return (CONFIDENCE_RANK[b.confidence] ?? 0) - (CONFIDENCE_RANK[a.confidence] ?? 0);
    case 'regulator':
      return a.regulator.localeCompare(b.regulator);
  }
}

function jurisdictionOrder(j: Jurisdiction): number {
  return { US: 1, UK: 2, EU: 3, IN: 4 }[j];
}

function groupOrderFor(groupBy: GroupKey, keys: string[]): string[] {
  if (groupBy === 'jurisdiction') {
    const order: Jurisdiction[] = ['US', 'UK', 'EU', 'IN'];
    return order.filter((j) => keys.includes(j));
  }
  if (groupBy === 'frequency') {
    return Object.keys(FREQUENCY_RANK).filter((k) => keys.includes(k));
  }
  if (groupBy === 'confidence') {
    return ['high', 'medium', 'low'].filter((k) => keys.includes(k));
  }
  return [...keys].sort();
}

function groupHeader(groupBy: GroupKey, key: string): string {
  if (groupBy === 'jurisdiction') return JURISDICTION_LABEL[key as Jurisdiction] ?? key;
  if (groupBy === 'frequency') return FREQ_LABEL[key] ?? key;
  if (groupBy === 'confidence') return key.charAt(0).toUpperCase() + key.slice(1) + ' confidence';
  return key;
}
