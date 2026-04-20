import Link from 'next/link';
import type { Metadata } from 'next';
import RegulatorCard from '@/components/RegulatorCard';
import { groupByRegulator } from '@/lib/catalog-pivot';

export const metadata: Metadata = {
  title: 'Regulators',
  description: 'Browse the regulators CapGenie tracks — FFIEC, SEC, Federal Reserve, EBA, CBI, RBI, and more — with every report each one issues.',
};

export default function RegulatorsPage() {
  const buckets = groupByRegulator();
  const totalReports = buckets.reduce((sum, b) => sum + b.reports.length, 0);

  const byJurisdiction = buckets.reduce<Record<string, typeof buckets>>((acc, b) => {
    for (const j of b.regulator.jurisdictions) {
      (acc[j] ||= []).push(b);
    }
    return acc;
  }, {});

  const order: Array<keyof typeof byJurisdiction> = ['US', 'UK', 'EU', 'IN', 'CA', 'SG', 'HK'];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <nav className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span className="mx-2">·</span>
          <span className="text-slate-700 dark:text-slate-200">Regulators</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Regulators
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
          Every regulator in CapGenie&apos;s catalog. Click through to see the reports each one issues and which banks we&apos;ve analyzed that would file them. {buckets.length} regulators · {totalReports} reports catalogued.
        </p>
      </header>

      {order.map((j) => {
        const inJ = byJurisdiction[j];
        if (!inJ || inJ.length === 0) return null;
        return (
          <section key={j} className="mb-10">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {j === 'US' ? 'United States' : j === 'UK' ? 'United Kingdom' : j === 'EU' ? 'European Union' : j === 'IN' ? 'India' : j === 'CA' ? 'Canada' : j === 'SG' ? 'Singapore' : 'Hong Kong'}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inJ.map((b) => (
                <RegulatorCard key={b.regulator.slug} regulator={b.regulator} reportCount={b.reports.length} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
