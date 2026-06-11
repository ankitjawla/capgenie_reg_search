'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HistoryEntry {
  id: number;
  bankName: string;
  rulesVersion: string;
  generatedAtIso: string;
  createdAtIso: string;
  assetSizeTier: string;
  hqCountry: string | null;
  reportCount: number;
}

interface HistoryResponse {
  dbEnabled: boolean;
  entries: HistoryEntry[];
}

const TIER_LABEL: Record<string, string> = {
  lt_1B: '< $1B',
  '1B_to_10B': '$1B – $10B',
  '10B_to_50B': '$10B – $50B',
  '50B_to_100B': '$50B – $100B',
  '100B_to_250B': '$100B – $250B',
  '250B_to_700B': '$250B – $700B',
  gt_700B: '> $700B',
  unknown: 'Unknown',
};

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch('/api/history?limit=50')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as HistoryResponse;
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-brand-700 dark:hover:text-brand-400">
          Home
        </Link>{' '}
        / History
      </nav>

      <header className="mt-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Recent analyses
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          The last 50 analyses run by CapGenie, newest first. Click any row to re-run that bank — the
          deep agent will return the cached result instantly if it&apos;s still within the 24h TTL.
        </p>
      </header>

      {loading && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Loading…
        </div>
      )}

      {error && (
        <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-200">
          Failed to load history: {error}
        </div>
      )}

      {data && !data.dbEnabled && (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
          <strong>Persistent DB not connected.</strong> History is only kept in-memory and will be
          empty on this view. Provision Neon via Vercel → Storage to enable.
        </div>
      )}

      {data && data.entries.length === 0 && data.dbEnabled && (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No analyses yet — try <Link href="/analyze" className="text-brand-700 hover:underline dark:text-brand-400">running one</Link>.
        </div>
      )}

      {data && data.entries.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/40">
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold">Bank</th>
                <th className="px-4 py-3 font-semibold">HQ</th>
                <th className="px-4 py-3 font-semibold">Size tier</th>
                <th className="px-4 py-3 font-semibold">Reports</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/analyze?bankName=${encodeURIComponent(e.bankName)}`}
                      className="font-semibold text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {e.bankName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {e.hqCountry ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {TIER_LABEL[e.assetSizeTier] ?? e.assetSizeTier}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {e.reportCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(e.createdAtIso).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
