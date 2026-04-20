import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { REPORT_CATALOG } from '@/lib/reports-catalog';
import { regulatorsForReport } from '@/lib/catalog-pivot';

export function generateStaticParams() {
  return Object.keys(REPORT_CATALOG).map((catalogId) => ({ catalogId }));
}

interface Props {
  params: { catalogId: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const entry = REPORT_CATALOG[params.catalogId as keyof typeof REPORT_CATALOG];
  if (!entry) return { title: 'Report not found' };
  return {
    title: `${entry.shortName} — ${entry.regulator}`,
    description: entry.description,
  };
}

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

export default function ReportDetailPage({ params }: Props) {
  const entry = REPORT_CATALOG[params.catalogId as keyof typeof REPORT_CATALOG];
  if (!entry) notFound();
  const regulators = regulatorsForReport(entry);
  const primary = regulators[0];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <nav className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">·</span>
        <Link href="/regulators" className="hover:text-brand-600">Regulators</Link>
        {primary && (
          <>
            <span className="mx-2">·</span>
            <Link href={`/regulator/${primary.slug}`} className="hover:text-brand-600">
              {primary.name}
            </Link>
          </>
        )}
        <span className="mx-2">·</span>
        <span className="text-slate-700 dark:text-slate-200">{entry.shortName}</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {regulators.map((r) => (
            <Link
              key={r.slug}
              href={`/regulator/${r.slug}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            >
              <span className="mr-1" aria-hidden>{r.emoji}</span>
              {r.name}
            </Link>
          ))}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {entry.jurisdiction}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {FREQ_LABEL[entry.frequency] ?? entry.frequency}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {entry.shortName}
        </h1>
        <p className="mt-1 text-base text-slate-700 dark:text-slate-300">{entry.fullName}</p>
        <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{entry.description}</p>
        {entry.referenceUrl && (
          <a
            href={entry.referenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400"
          >
            Primary-source reference ↗
          </a>
        )}
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Catalog metadata
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Catalog ID</dt>
            <dd className="font-mono text-slate-800 dark:text-slate-200">{entry.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Jurisdiction</dt>
            <dd className="text-slate-800 dark:text-slate-200">{entry.jurisdiction}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Regulator(s)</dt>
            <dd className="text-slate-800 dark:text-slate-200">{entry.regulator}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Frequency</dt>
            <dd className="text-slate-800 dark:text-slate-200">{FREQ_LABEL[entry.frequency] ?? entry.frequency}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Who files this?
        </h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          CapGenie&apos;s rules engine decides this per-bank based on jurisdiction, asset size, activities, and designations.
          Run an analysis from the <Link href="/" className="text-brand-700 underline dark:text-brand-400">home page</Link> — if this report applies to that bank, you&apos;ll see it in the results with an &quot;applicability reason&quot; explaining why.
        </p>
      </section>
    </main>
  );
}
