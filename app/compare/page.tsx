'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { AnalysisResult, ReportRecommendation } from '@/lib/types';

type Slot = 'A' | 'B';

type SlotState = {
  name: string;
  loading: boolean;
  error: string | null;
  progress: string[];
  result: AnalysisResult | null;
};

const INITIAL: SlotState = { name: '', loading: false, error: null, progress: [], result: null };

export default function ComparePage() {
  const [a, setA] = useState<SlotState>(INITIAL);
  const [b, setB] = useState<SlotState>(INITIAL);
  const setters: Record<Slot, React.Dispatch<React.SetStateAction<SlotState>>> = { A: setA, B: setB };

  async function runOne(slot: Slot, name: string) {
    const setter = setters[slot];
    setter({ name, loading: true, error: null, progress: [], result: null });
    try {
      const res = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName: name }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setter((s) => ({ ...s, loading: false, error: data?.error ?? `HTTP ${res.status}` }));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim()) as
              | { type: 'info'; message: string }
              | { type: 'search'; query: string }
              | { type: 'text'; delta: string }
              | { type: 'result'; result: AnalysisResult }
              | { type: 'error'; error: string };
            if (evt.type === 'info' || evt.type === 'search') {
              const msg = evt.type === 'info' ? evt.message : `Searching: ${evt.query}`;
              setter((s) => ({ ...s, progress: [...s.progress, msg] }));
            } else if (evt.type === 'result') {
              setter((s) => ({ ...s, result: evt.result }));
            } else if (evt.type === 'error') {
              setter((s) => ({ ...s, error: evt.error }));
            }
          } catch {
            // skip malformed
          }
        }
      }
    } catch (e: unknown) {
      setter((s) => ({
        ...s,
        error: e instanceof Error ? e.message : 'Unknown error',
      }));
    } finally {
      setter((s) => ({ ...s, loading: false }));
    }
  }

  async function runBoth(e: React.FormEvent) {
    e.preventDefault();
    const nameA = a.name.trim();
    const nameB = b.name.trim();
    if (!nameA || !nameB) return;
    await Promise.all([runOne('A', nameA), runOne('B', nameB)]);
  }

  const diff = computeDiff(a.result?.reports, b.result?.reports);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            CapGenie · Compare
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Run two banks through the deep agent and see which reports overlap vs. diverge.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          ← Single bank
        </Link>
      </header>

      <form onSubmit={runBoth} className="grid gap-4 sm:grid-cols-2">
        {(['A', 'B'] as Slot[]).map((slot) => {
          const s = slot === 'A' ? a : b;
          return (
            <div
              key={slot}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <label
                htmlFor={`compare-bank-${slot}`}
                className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Bank {slot}
              </label>
              <input
                id={`compare-bank-${slot}`}
                type="text"
                value={s.name}
                onChange={(e) => setters[slot]((st) => ({ ...st, name: e.target.value }))}
                disabled={a.loading || b.loading}
                placeholder={slot === 'A' ? 'e.g. JPMorgan Chase' : 'e.g. HDFC Bank'}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              {s.progress.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-500 dark:text-slate-400">
                  {s.progress.slice(-6).map((p, i) => (
                    <li key={i}>· {p}</li>
                  ))}
                </ul>
              )}
              {s.error && (
                <p className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-900/40 dark:text-red-200">
                  {s.error}
                </p>
              )}
              {s.result && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  ✓ {s.result.profile.legalName} — {s.result.reports.length} report
                  {s.result.reports.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
          );
        })}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={a.loading || b.loading || !a.name.trim() || !b.name.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {a.loading || b.loading ? 'Analyzing…' : 'Compare'}
          </button>
        </div>
      </form>

      {diff && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <DiffColumn
            title={`${a.result?.profile.legalName} only`}
            items={diff.aOnly}
            tone="a"
          />
          <DiffColumn title="Shared by both" items={diff.shared} tone="shared" />
          <DiffColumn
            title={`${b.result?.profile.legalName} only`}
            items={diff.bOnly}
            tone="b"
          />
        </div>
      )}
    </main>
  );
}

function DiffColumn({
  title,
  items,
  tone,
}: {
  title: string;
  items: ReportRecommendation[];
  tone: 'a' | 'b' | 'shared';
}) {
  const toneClass =
    tone === 'shared'
      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-900/20'
      : tone === 'a'
      ? 'border-sky-200 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-900/20'
      : 'border-violet-200 bg-violet-50 dark:border-violet-800/60 dark:bg-violet-900/20';
  return (
    <section className={`rounded-2xl border p-4 ${toneClass}`}>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title} <span className="text-slate-500 dark:text-slate-400">({items.length})</span>
      </h3>
      <ul className="mt-2 space-y-1 text-sm">
        {items.map((r) => (
          <li key={r.id} className="flex justify-between gap-2">
            <span className="text-slate-800 dark:text-slate-100">
              <span className="mr-1 rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                {r.jurisdiction}
              </span>
              {r.shortName}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{r.frequency}</span>
          </li>
        ))}
        {items.length === 0 && <li className="text-slate-500 dark:text-slate-400">—</li>}
      </ul>
    </section>
  );
}

function computeDiff(
  aReports?: ReportRecommendation[],
  bReports?: ReportRecommendation[],
) {
  if (!aReports || !bReports) return null;
  const aIds = new Set(aReports.map((r) => r.id));
  const bIds = new Set(bReports.map((r) => r.id));
  const aOnly = aReports.filter((r) => !bIds.has(r.id));
  const bOnly = bReports.filter((r) => !aIds.has(r.id));
  const shared = aReports.filter((r) => bIds.has(r.id));
  return { aOnly, bOnly, shared };
}

