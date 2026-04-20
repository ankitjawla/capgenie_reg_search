'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import StatusChip from './StatusChip';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/regulators', label: 'Regulators' },
  { href: '/compare', label: 'Compare' },
];

export default function SiteHeader() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur no-print dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
            C
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">CapGenie</span>
          <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 sm:inline dark:bg-slate-800 dark:text-slate-300">
            Regulatory Report Advisor
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((n) => {
            const active = path === n.href || (n.href !== '/' && path?.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-2.5 py-1 ${
                  active
                    ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <span className="ml-2 hidden text-xs text-slate-400 sm:inline">
            <kbd className="rounded border border-slate-300 px-1 dark:border-slate-600">⌘K</kbd>
          </span>
          <span className="ml-2">
            <StatusChip />
          </span>
        </nav>
      </div>
    </header>
  );
}
