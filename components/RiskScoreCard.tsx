'use client';

import { useMemo } from 'react';
import type { ReportRecommendation } from '@/lib/types';
import { computeRiskScore, scoreLabel } from '@/lib/risk-score';

interface Props {
  reports: ReportRecommendation[];
}

const TONE_COLORS = {
  low: { ring: 'ring-energy-400', text: 'text-energy-500', bg: 'bg-energy-100 dark:bg-energy-500/20' },
  mid: { ring: 'ring-brand-400', text: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/20' },
  high: { ring: 'ring-accent-500', text: 'text-accent-500', bg: 'bg-accent-50 dark:bg-accent-500/20' },
} as const;

export default function RiskScoreCard({ reports }: Props) {
  const score = useMemo(() => computeRiskScore(reports), [reports]);
  const tone = scoreLabel(score.score).tone;
  const colors = TONE_COLORS[tone];
  const label = scoreLabel(score.score).label;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <div className="flex flex-wrap items-center gap-5">
        <div
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full ring-4 ${colors.ring} ${colors.bg}`}
        >
          <div className="text-center">
            <div className={`text-3xl font-extrabold leading-none ${colors.text}`}>{score.score}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              / 100
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
            Compliance burden
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.bg} ${colors.text}`}
            >
              {label}
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sums report frequency × jurisdiction-complexity × confidence weights. Higher = more
            estimated filings per year. Opinionated and comparative, not a regulatory benchmark.
          </p>
          {score.topContributors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Heaviest contributors:</span>
              {score.topContributors.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {c.shortName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
