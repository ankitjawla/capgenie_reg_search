'use client';

import { useMemo, useState } from 'react';
import type { ReportRecommendation } from '@/lib/types';

// Simple 12-month calendar rendering the reports that "land" each month.
//
// Frequency → month membership:
//   daily / weekly / fortnightly / monthly  → every month
//   quarterly                               → Mar / Jun / Sep / Dec
//   semi_annual                             → Jun / Dec
//   annual                                  → a single month; for US reports
//                                             we use the common call-report
//                                             timing (Mar), for EU FINREP we
//                                             use Feb, for RBI we use Jun,
//                                             for UK we use Feb; fallback Mar
//   event_driven / ad_hoc                   → shown separately (not on grid)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthsForReport(r: ReportRecommendation): number[] {
  switch (r.frequency) {
    case 'daily':
    case 'weekly':
    case 'fortnightly':
    case 'monthly':
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    case 'quarterly':
      return [2, 5, 8, 11];
    case 'semi_annual':
      return [5, 11];
    case 'annual': {
      const j = r.jurisdiction;
      if (j === 'EU') return [1]; // FINREP annual ≈ Feb
      if (j === 'UK') return [1];
      if (j === 'IN') return [5]; // Jun (fiscal-year-end banks)
      return [2]; // default US annual reports
    }
    case 'event_driven':
    case 'ad_hoc':
    default:
      return [];
  }
}

interface Props {
  reports: ReportRecommendation[];
}

export default function FilingCalendar({ reports }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const byMonth = useMemo(() => {
    const map = new Map<number, ReportRecommendation[]>();
    for (let m = 0; m < 12; m++) map.set(m, []);
    for (const r of reports) {
      for (const m of monthsForReport(r)) {
        map.get(m)!.push(r);
      }
    }
    return map;
  }, [reports]);

  const eventDriven = useMemo(
    () => reports.filter((r) => r.frequency === 'event_driven' || r.frequency === 'ad_hoc'),
    [reports],
  );

  const max = Math.max(1, ...Array.from(byMonth.values()).map((l) => l.length));
  const selectedList = selectedMonth != null ? byMonth.get(selectedMonth) ?? [] : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Filing calendar</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {reports.length} report{reports.length === 1 ? '' : 's'} · click a month to see what lands
        </p>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {MONTHS.map((label, m) => {
          const count = byMonth.get(m)!.length;
          const intensity = Math.round((count / max) * 100);
          const isSelected = selectedMonth === m;
          return (
            <button
              type="button"
              key={m}
              onClick={() => setSelectedMonth((cur) => (cur === m ? null : m))}
              className={`flex flex-col items-center justify-center rounded-lg border p-2 text-xs font-medium transition ${
                isSelected
                  ? 'border-brand-600 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-900/40 dark:text-brand-100'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: isSelected
                  ? undefined
                  : count
                  ? `hsl(215, 90%, ${Math.max(92 - intensity * 0.35, 60)}%)`
                  : undefined,
              }}
            >
              <span>{label}</span>
              <span className="mt-1 text-base font-semibold">{count}</span>
            </button>
          );
        })}
      </div>

      {selectedMonth != null && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {MONTHS[selectedMonth]} — {selectedList.length} filing{selectedList.length === 1 ? '' : 's'}
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {selectedList.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span className="text-slate-800 dark:text-slate-200">
                  <span className="mr-1 rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    {r.jurisdiction}
                  </span>
                  {r.shortName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{r.frequency}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {eventDriven.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
          <div className="font-semibold">Event-driven / ad-hoc ({eventDriven.length})</div>
          <p className="mt-1 text-xs">
            {eventDriven.map((r) => r.shortName).join(' · ')}
          </p>
        </div>
      )}
    </section>
  );
}
