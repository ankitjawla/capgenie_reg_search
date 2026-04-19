import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-bold tracking-tight text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        We can&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link
          href="/"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          Back to CapGenie
        </Link>
        <Link
          href="/compare"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Compare two banks
        </Link>
      </div>
    </main>
  );
}
