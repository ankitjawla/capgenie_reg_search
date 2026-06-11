import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATORS, findRegulatorBySlug } from '@/lib/regulators';
import { reportsForRegulator } from '@/lib/catalog-pivot';
import type { CatalogEntry } from '@/lib/reports-catalog';
import RegulatorCompareForm from '@/components/RegulatorCompareForm';

export const metadata: Metadata = {
  title: 'Regulator compare · CapGenie',
  description:
    'Side-by-side what two regulators require — pick any pair from the 30 in the CapGenie library.',
};

interface SearchParams {
  a?: string;
  b?: string;
}

export default function RegulatorComparePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const a = searchParams?.a ? findRegulatorBySlug(searchParams.a) : null;
  const b = searchParams?.b ? findRegulatorBySlug(searchParams.b) : null;
  const aReports = a ? reportsForRegulator(a.slug) : [];
  const bReports = b ? reportsForRegulator(b.slug) : [];
  const aIds = new Set(aReports.map((r) => r.id));
  const bIds = new Set(bReports.map((r) => r.id));
  const shared = aReports.filter((r) => bIds.has(r.id));
  const onlyA = aReports.filter((r) => !bIds.has(r.id));
  const onlyB = bReports.filter((r) => !aIds.has(r.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-400">
          Home
        </Link>{' '}
        /{' '}
        <Link href="/regulators" className="hover:text-brand-700 dark:hover:text-brand-400">
          Regulators
        </Link>{' '}
        / Compare
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Compare regulators
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Pick any two of the {REGULATORS.length} regulators in the CapGenie library to see which
          reports they share, which are unique to one, and what each one supervises.
        </p>
      </header>

      <RegulatorCompareForm
        regulators={REGULATORS.map((r) => ({ slug: r.slug, name: r.name, emoji: r.emoji, jurisdictions: r.jurisdictions }))}
        initialA={a?.slug}
        initialB={b?.slug}
      />

      {a && b && (
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Column title={`${a.emoji} ${a.name} only`} regulator={a} reports={onlyA} tone="a" />
          <Column title="Shared by both" regulator={null} reports={shared} tone="shared" />
          <Column title={`${b.emoji} ${b.name} only`} regulator={b} reports={onlyB} tone="b" />
        </div>
      )}

      {a && b && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <BioPanel regulator={a} />
          <BioPanel regulator={b} />
        </div>
      )}
    </main>
  );
}

function Column({
  title,
  reports,
  tone,
}: {
  title: string;
  regulator: ReturnType<typeof findRegulatorBySlug> | null;
  reports: CatalogEntry[];
  tone: 'a' | 'b' | 'shared';
}) {
  const toneClass =
    tone === 'shared'
      ? 'border-energy-400 bg-energy-100/60 dark:border-energy-500/60 dark:bg-energy-500/20'
      : tone === 'a'
      ? 'border-brand-200 bg-brand-50 dark:border-brand-800/60 dark:bg-brand-900/30'
      : 'border-accent-200 bg-accent-50 dark:border-accent-700/60 dark:bg-accent-500/15';
  return (
    <section className={`rounded-2xl border p-4 ${toneClass}`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {title} <span className="text-slate-500 dark:text-slate-400">({reports.length})</span>
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {reports.map((r) => (
          <li key={r.id} className="flex justify-between gap-2">
            <Link
              href={`/report/${r.id}`}
              className="text-slate-800 hover:underline dark:text-slate-100"
            >
              <span className="mr-1 rounded bg-white/70 px-1 py-0.5 text-[10px] font-mono uppercase text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-200">
                {r.jurisdiction}
              </span>
              {r.shortName}
            </Link>
            <span className="text-xs text-slate-500 dark:text-slate-400">{r.frequency}</span>
          </li>
        ))}
        {reports.length === 0 && <li className="text-slate-500 dark:text-slate-400">—</li>}
      </ul>
    </section>
  );
}

function BioPanel({ regulator }: { regulator: NonNullable<ReturnType<typeof findRegulatorBySlug>> }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
        <span aria-hidden>{regulator.emoji}</span> {regulator.name}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {regulator.jurisdictions.join(' · ')}
      </p>
      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{regulator.shortBio}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <a
          href={regulator.website}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700 hover:bg-brand-100 dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-300"
        >
          Official site ↗
        </a>
        <Link
          href={`/regulator/${regulator.slug}`}
          className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Full report list →
        </Link>
      </div>
    </section>
  );
}
