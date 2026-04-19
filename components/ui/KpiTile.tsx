import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accent?: 'default' | 'brand' | 'emerald' | 'amber' | 'red';
}

const ACCENT_CLASS: Record<NonNullable<Props['accent']>, string> = {
  default:
    'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700',
  brand:
    'bg-brand-50 text-brand-900 dark:bg-brand-900/40 dark:text-brand-100 border-brand-200 dark:border-brand-800',
  emerald:
    'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800',
  amber:
    'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 border-amber-200 dark:border-amber-800',
  red:
    'bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-100 border-red-200 dark:border-red-800',
};

export default function KpiTile({ label, value, detail, accent = 'default' }: Props) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-3 shadow-sm transition ${ACCENT_CLASS[accent]}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="mt-1 text-xl font-bold leading-tight">{value}</span>
      {detail && <span className="mt-0.5 text-xs opacity-75">{detail}</span>}
    </div>
  );
}
