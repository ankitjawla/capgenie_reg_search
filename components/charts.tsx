'use client';

import {
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { BankProfile, Jurisdiction, ReportRecommendation } from '@/lib/types';

const JURISDICTION_COLORS: Record<Jurisdiction, string> = {
  US: '#3b82f6',
  UK: '#8b5cf6',
  EU: '#06b6d4',
  IN: '#f59e0b',
};

const FREQUENCY_ORDER = [
  'daily',
  'weekly',
  'fortnightly',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'event_driven',
  'ad_hoc',
] as const;

const FREQUENCY_LABEL: Record<string, string> = {
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

// ---------- Reports by jurisdiction (donut) ----------

export function ReportsByJurisdictionChart({ reports }: { reports: ReportRecommendation[] }) {
  const counts = reports.reduce<Record<string, number>>((acc, r) => {
    acc[r.jurisdiction] = (acc[r.jurisdiction] ?? 0) + 1;
    return acc;
  }, {});
  const data = (Object.keys(counts) as Jurisdiction[]).map((j) => ({
    name: j,
    value: counts[j],
  }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Reports by jurisdiction
      </h3>
      <div className="h-44">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={36}
              outerRadius={62}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={JURISDICTION_COLORS[entry.name as Jurisdiction] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              wrapperStyle={{ fontSize: 12 }}
              contentStyle={{ borderRadius: 6 }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => v as string}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- Reports by frequency (horizontal bar) ----------

export function ReportsByFrequencyChart({ reports }: { reports: ReportRecommendation[] }) {
  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.frequency] = (counts[r.frequency] ?? 0) + 1;
  const data = FREQUENCY_ORDER.filter((f) => counts[f]).map((f) => ({
    name: FREQUENCY_LABEL[f] ?? f,
    count: counts[f],
  }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Reports by frequency
      </h3>
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip wrapperStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 6 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- Assets by jurisdiction (stacked bar) ----------

export function AssetsByJurisdictionChart({ profile }: { profile: BankProfile }) {
  const data = profile.presence
    .filter((p) => (p.jurisdictionAssetsUsdB ?? 0) > 0)
    .map((p) => ({
      jurisdiction: p.jurisdiction,
      assetsB: p.jurisdictionAssetsUsdB!,
    }));
  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 print-card">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Assets by jurisdiction (USD B)
      </h3>
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
            <XAxis dataKey="jurisdiction" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
            <Tooltip wrapperStyle={{ fontSize: 12 }} contentStyle={{ borderRadius: 6 }} formatter={(v) => `$${v}B`} />
            <Bar dataKey="assetsB" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.jurisdiction} fill={JURISDICTION_COLORS[entry.jurisdiction as Jurisdiction] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
