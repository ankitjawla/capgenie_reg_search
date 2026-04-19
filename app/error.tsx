'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CapGenie route error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl text-red-700 dark:bg-red-900/40 dark:text-red-200">
        !
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Something went wrong on this page
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {error.message || 'Unknown error.'}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-slate-400">Error reference: {error.digest}</p>
      )}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Back to home
        </Link>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        If this keeps happening,{' '}
        <a
          href="https://github.com/ankitjawla/capgenie_reg_search/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-600 underline"
        >
          report it on GitHub
        </a>
        .
      </p>
    </main>
  );
}
