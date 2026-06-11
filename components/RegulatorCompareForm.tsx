'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RegulatorOption {
  slug: string;
  name: string;
  emoji: string;
  jurisdictions: string[];
}

interface Props {
  regulators: RegulatorOption[];
  initialA?: string;
  initialB?: string;
}

export default function RegulatorCompareForm({ regulators, initialA, initialB }: Props) {
  const router = useRouter();
  const [a, setA] = useState(initialA ?? '');
  const [b, setB] = useState(initialB ?? '');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!a || !b || a === b) return;
    router.push(`/regulator-compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
      <select
        value={a}
        onChange={(e) => setA(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">Pick regulator A…</option>
        {regulators.map((r) => (
          <option key={r.slug} value={r.slug} disabled={r.slug === b}>
            {r.emoji} {r.name} ({r.jurisdictions.join(', ')})
          </option>
        ))}
      </select>
      <div className="hidden self-center text-slate-500 dark:text-slate-400 sm:block">vs</div>
      <select
        value={b}
        onChange={(e) => setB(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">Pick regulator B…</option>
        {regulators.map((r) => (
          <option key={r.slug} value={r.slug} disabled={r.slug === a}>
            {r.emoji} {r.name} ({r.jurisdictions.join(', ')})
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!a || !b || a === b}
        className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Compare
      </button>
    </form>
  );
}
