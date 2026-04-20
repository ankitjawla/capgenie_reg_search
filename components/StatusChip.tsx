'use client';

import { useEffect, useState } from 'react';

interface HealthPayload {
  status: 'ok' | 'degraded';
  env: { azure: boolean; search: boolean; db: boolean; sentry: boolean; searchProvider: string | null };
  gitSha: string | null;
}

export default function StatusChip() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/health')
      .then((r) => r.json())
      .then((j: HealthPayload) => {
        if (alive) setHealth(j);
      })
      .catch(() => {
        if (alive) setHealth({ status: 'degraded', env: { azure: false, search: false, db: false, sentry: false, searchProvider: null }, gitSha: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!health) return null;
  const activeCount = [health.env.azure, health.env.search, health.env.db, health.env.sentry].filter(Boolean).length;
  const tone =
    health.status === 'ok'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';

  return (
    <a
      href="/api/health"
      target="_blank"
      rel="noopener noreferrer"
      title={`azure=${health.env.azure} · search=${health.env.searchProvider ?? 'none'} · db=${health.env.db} · sentry=${health.env.sentry} · ${health.gitSha ?? ''}`}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {activeCount}/4 ok
    </a>
  );
}
