import Link from 'next/link';
import type { RegulatorMeta } from '@/lib/regulators';

interface Props {
  regulator: RegulatorMeta;
  reportCount: number;
}

export default function RegulatorCard({ regulator, reportCount }: Props) {
  return (
    <Link
      href={`/regulator/${regulator.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>
            {regulator.emoji}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-400">
              {regulator.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {regulator.jurisdictions.join(' · ')} · {reportCount} report{reportCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
        {regulator.shortBio}
      </p>
      <div className="mt-3 text-xs text-brand-700 dark:text-brand-400">View reports →</div>
    </Link>
  );
}
