'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CatalogEntry } from '@/lib/reports-catalog';
import type { Jurisdiction, ReportFrequency } from '@/lib/types';

interface Props {
  entries: CatalogEntry[];
  jurisdictionLabel: Record<Jurisdiction, string>;
  frequencyLabel: Record<ReportFrequency, string>;
}

const FREQ_ORDER: ReportFrequency[] = [
  'daily',
  'weekly',
  'fortnightly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'event_driven',
  'ad_hoc',
];

export default function ReportsBrowser({ entries, jurisdictionLabel, frequencyLabel }: Props) {
  const [search, setSearch] = useState('');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | 'all'>('all');
  const [frequency, setFrequency] = useState<ReportFrequency | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (jurisdiction !== 'all' && e.jurisdiction !== jurisdiction) return false;
      if (frequency !== 'all' && e.frequency !== frequency) return false;
      if (!q) return true;
      return (
        e.id.toLowerCase().includes(q) ||
        e.shortName.toLowerCase().includes(q) ||
        e.fullName.toLowerCase().includes(q) ||
        e.regulator.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }, [entries, search, jurisdiction, frequency]);

  const jurisdictions = Array.from(new Set(entries.map((e) => e.jurisdiction))) as Jurisdiction[];

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, regulator, description…"
            className="min-w-[14rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Jurisdiction
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value as Jurisdiction | 'all')}
              className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All</option>
              {jurisdictions.map((j) => (
                <option key={j} value={j}>
                  {jurisdictionLabel[j] ?? j}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Frequency
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ReportFrequency | 'all')}
              className="ml-1 rounded border border-slate-300 bg-white px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All</option>
              {FREQ_ORDER.filter((f) => entries.some((e) => e.frequency === f)).map((f) => (
                <option key={f} value={f}>
                  {frequencyLabel[f]}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filtered.length} of {entries.length}
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/40">
            <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 font-semibold">Jur.</th>
              <th className="px-4 py-3 font-semibold">Short name</th>
              <th className="px-4 py-3 font-semibold">Full name</th>
              <th className="px-4 py-3 font-semibold">Regulator</th>
              <th className="px-4 py-3 font-semibold">Cadence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((e) => (
              <tr
                key={e.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {e.jurisdiction}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/report/${e.id}`}
                    className="font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {e.shortName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{e.fullName}</td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {e.regulator}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {frequencyLabel[e.frequency]}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No reports match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
