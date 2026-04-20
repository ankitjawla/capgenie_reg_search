import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { findRegulatorBySlug, REGULATORS } from '@/lib/regulators';
import { reportsForRegulator } from '@/lib/catalog-pivot';

export function generateStaticParams() {
  return REGULATORS.map((r) => ({ slug: r.slug }));
}

interface Props {
  params: { slug: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const reg = findRegulatorBySlug(params.slug);
  if (!reg) return { title: 'Regulator not found' };
  return {
    title: `${reg.name} — Regulator`,
    description: reg.shortBio,
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

export default function RegulatorDetailPage({ params }: Props) {
  const reg = findRegulatorBySlug(params.slug);
  if (!reg) notFound();
  const reports = reportsForRegulator(params.slug);

  const counts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.frequency] = (acc[r.frequency] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <nav className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">·</span>
        <Link href="/regulators" className="hover:text-brand-600">Regulators</Link>
        <span className="mx-2">·</span>
        <span className="text-slate-700 dark:text-slate-200">{reg.name}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-3xl shadow-inner dark:bg-brand-900/40" aria-hidden>
            {reg.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {reg.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {reg.jurisdictions.join(' · ')}
              {' · '}
              <a href={reg.website} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 underline-offset-2 hover:text-brand-600 dark:decoration-slate-600">
                Official site
              </a>
            </p>
          </div>
        </div>
        <div className="grid min-w-[16rem] grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="Reports" value={String(reports.length)} />
          <Kpi label="Monthly+" value={String((counts.daily ?? 0) + (counts.weekly ?? 0) + (counts.fortnightly ?? 0) + (counts.monthly ?? 0))} />
          <Kpi label="Quarterly" value={String(counts.quarterly ?? 0)} />
          <Kpi label="Annual" value={String(counts.annual ?? 0)} />
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          About
        </h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{reg.shortBio}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-baseline justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reports</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{reports.length} total</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Short name</th>
                <th className="px-6 py-3">Full name</th>
                <th className="px-6 py-3">Frequency</th>
                <th className="px-6 py-3">Jurisdiction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3">
                    <Link
                      href={`/report/${r.id}`}
                      className="font-medium text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400"
                    >
                      {r.shortName}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-700 dark:text-slate-300">
                    {r.fullName}
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{r.description}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium dark:bg-slate-700">
                      {FREQ_LABEL[r.frequency] ?? r.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">{r.jurisdiction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-800/40">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
