import type { Metadata } from 'next';
import Link from 'next/link';
import { REPORT_CATALOG, type CatalogEntry } from '@/lib/reports-catalog';
import type { Jurisdiction, ReportFrequency } from '@/lib/types';
import ReportsBrowser from '@/components/ReportsBrowser';

export const metadata: Metadata = {
  title: 'All reports · CapGenie',
  description:
    'Browse every regulatory report CapGenie tracks — filter by jurisdiction, frequency, or regulator.',
};

const JURISDICTION_LABEL: Record<Jurisdiction, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  EU: 'European Union',
  IN: 'India',
  CA: 'Canada',
  SG: 'Singapore',
  HK: 'Hong Kong',
};

const FREQUENCY_LABEL: Record<ReportFrequency, string> = {
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

export default function ReportsBrowsePage() {
  const entries: CatalogEntry[] = Object.values(REPORT_CATALOG);
  const total = entries.length;
  const byJurisdiction = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.jurisdiction] = (acc[e.jurisdiction] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-400">
          Home
        </Link>{' '}
        / All reports
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          All reports · {total}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Every regulatory report in the CapGenie catalog. Filter by jurisdiction, frequency, or
          regulator. Click a row for the full description and regulator back-links.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        {Object.entries(byJurisdiction)
          .sort((a, b) => b[1] - a[1])
          .map(([jur, count]) => (
            <span
              key={jur}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {JURISDICTION_LABEL[jur as Jurisdiction] ?? jur}
              </span>
              <span className="ml-1 text-slate-500 dark:text-slate-400">{count}</span>
            </span>
          ))}
      </div>

      <ReportsBrowser
        entries={entries}
        jurisdictionLabel={JURISDICTION_LABEL}
        frequencyLabel={FREQUENCY_LABEL}
      />
    </main>
  );
}
