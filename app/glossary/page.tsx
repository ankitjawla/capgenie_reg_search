import type { Metadata } from 'next';
import Link from 'next/link';
import { GLOSSARY, type GlossaryEntry } from '@/lib/glossary';

export const metadata: Metadata = {
  title: 'Glossary · CapGenie',
  description:
    'Plain-English explanations of regulatory designations, frameworks, and report names — G-SIB, COREP, FFIEC, FBO, IHC, MiCA, and more.',
};

const CATEGORY_ORDER: Array<GlossaryEntry['category']> = [
  'Designation',
  'Concept',
  'Body',
  'Filing',
];

export default function GlossaryPage() {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    cat,
    entries: GLOSSARY.filter((e) => e.category === cat).sort((a, b) =>
      a.term.localeCompare(b.term),
    ),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-400">
          Home
        </Link>{' '}
        / Glossary
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Regulatory glossary
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Plain-English explanations of the terms that show up across CapGenie analyses. Reach for
          these when a report acronym needs context before you click into the regulator&apos;s own page.
        </p>
      </header>

      {/* Quick-jump index */}
      <nav className="mt-6 flex flex-wrap gap-2 text-xs">
        {byCategory.map(({ cat, entries }) =>
          entries.length === 0 ? null : (
            <a
              key={cat}
              href={`#${cat.toLowerCase()}`}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-semibold text-brand-800 hover:bg-brand-100 dark:border-brand-800/60 dark:bg-brand-900/30 dark:text-brand-200"
            >
              {cat} · {entries.length}
            </a>
          ),
        )}
      </nav>

      {byCategory.map(({ cat, entries }) =>
        entries.length === 0 ? null : (
          <section key={cat} id={cat.toLowerCase()} className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{cat}</h2>
            <dl className="mt-4 space-y-4">
              {entries.map((e) => (
                <div
                  key={e.term}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <dt className="flex items-baseline gap-3">
                    <span className="text-lg font-bold text-brand-700 dark:text-brand-400">
                      {e.term}
                    </span>
                    {e.expansion && (
                      <span className="text-xs italic text-slate-500 dark:text-slate-400">
                        {e.expansion}
                      </span>
                    )}
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700 dark:text-slate-300">{e.body}</dd>
                  {e.links && e.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      {e.links.map((l) => (
                        <a
                          key={l.href}
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline dark:text-brand-400"
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </dl>
          </section>
        ),
      )}

      <p className="mt-12 text-xs text-slate-500 dark:text-slate-400">
        Glossary is intentionally short. For the canonical definition click through to the
        regulator&apos;s own page.
      </p>
    </main>
  );
}
