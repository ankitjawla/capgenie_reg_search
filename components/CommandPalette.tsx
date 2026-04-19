'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';

interface SavedBank {
  bankName: string;
  savedAtIso: string;
}

interface Props {
  savedBanks?: SavedBank[];
  onAnalyze: (bankName: string) => void;
  onTheme: (theme: 'light' | 'dark' | 'system') => void;
  onTab: (tab: 'reports' | 'calendar') => void;
  onCompare: () => void;
  onTranscript: () => void;
  onExportCsv: () => void;
  onClearSaved: () => void;
}

export default function CommandPalette({
  savedBanks = [],
  onAnalyze,
  onTheme,
  onTab,
  onCompare,
  onTranscript,
  onExportCsv,
  onClearSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function run(fn: () => void) {
    setOpen(false);
    setSearch('');
    fn();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 dark:bg-black/60"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mt-24 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="CapGenie command palette" className="text-sm">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a bank name or a command…"
            className="w-full border-0 border-b border-slate-200 bg-transparent px-4 py-3 text-base focus:outline-none dark:border-slate-700 dark:text-slate-100"
            autoFocus
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              No matches. Press Enter to analyze &ldquo;{search}&rdquo;.
            </Command.Empty>

            {search.trim().length > 0 && (
              <Command.Group heading="Analyze">
                <Command.Item
                  onSelect={() => run(() => onAnalyze(search.trim()))}
                  className="cursor-pointer rounded-md px-3 py-2 text-slate-800 aria-selected:bg-brand-50 dark:text-slate-100 dark:aria-selected:bg-brand-900/40"
                >
                  Run deep-agent analysis on <strong className="ml-1">{search.trim()}</strong>
                </Command.Item>
              </Command.Group>
            )}

            {savedBanks.length > 0 && (
              <Command.Group heading="Recent banks">
                {savedBanks.slice(0, 8).map((b) => (
                  <Command.Item
                    key={b.bankName}
                    value={`recent ${b.bankName}`}
                    onSelect={() => run(() => onAnalyze(b.bankName))}
                    className="cursor-pointer rounded-md px-3 py-2 text-slate-800 aria-selected:bg-brand-50 dark:text-slate-100 dark:aria-selected:bg-brand-900/40"
                  >
                    {b.bankName}
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(b.savedAtIso).toLocaleDateString()}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions">
              <Command.Item onSelect={() => run(() => onTab('reports'))} className={ITEM_CLASS}>
                Show reports
              </Command.Item>
              <Command.Item onSelect={() => run(() => onTab('calendar'))} className={ITEM_CLASS}>
                Show filing calendar
              </Command.Item>
              <Command.Item onSelect={() => run(onCompare)} className={ITEM_CLASS}>
                Compare two banks
              </Command.Item>
              <Command.Item onSelect={() => run(onTranscript)} className={ITEM_CLASS}>
                Open research transcript
              </Command.Item>
              <Command.Item onSelect={() => run(onExportCsv)} className={ITEM_CLASS}>
                Export reports as CSV
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Theme">
              <Command.Item onSelect={() => run(() => onTheme('light'))} className={ITEM_CLASS}>
                Switch to Light
              </Command.Item>
              <Command.Item onSelect={() => run(() => onTheme('dark'))} className={ITEM_CLASS}>
                Switch to Dark
              </Command.Item>
              <Command.Item onSelect={() => run(() => onTheme('system'))} className={ITEM_CLASS}>
                Switch to System
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Storage">
              <Command.Item onSelect={() => run(onClearSaved)} className={ITEM_CLASS}>
                Clear saved analyses
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}

const ITEM_CLASS =
  'cursor-pointer rounded-md px-3 py-2 text-slate-800 aria-selected:bg-brand-50 dark:text-slate-100 dark:aria-selected:bg-brand-900/40';
