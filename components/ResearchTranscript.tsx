'use client';

import { useEffect } from 'react';
import type { AnalysisTrace } from '@/lib/types';

interface Props {
  trace: AnalysisTrace;
  open: boolean;
  onClose: () => void;
}

export default function ResearchTranscript({ trace, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/50 p-4 dark:bg-black/60"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mt-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Research transcript
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {trace.searches.length} search{trace.searches.length === 1 ? '' : 'es'} · {trace.turns} agent turn
              {trace.turns === 1 ? '' : 's'} · {(trace.elapsedMs / 1000).toFixed(1)}s elapsed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {trace.searches.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No searches were recorded (cached result, or the agent didn&apos;t need to search).
            </p>
          )}
          <ol className="space-y-4 text-sm">
            {trace.searches.map((s, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    #{i + 1} &nbsp;<span className="font-mono text-xs text-slate-500 dark:text-slate-400">{s.agent ?? 'agent'}</span>
                  </span>
                </div>
                <p className="mt-1 text-slate-800 dark:text-slate-200">{s.query}</p>
                {s.results.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {s.results.slice(0, 5).map((r, j) => (
                      <li key={j} className="text-xs">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600 dark:text-brand-400"
                        >
                          {r.title || r.url}
                        </a>
                        {r.snippet && (
                          <span className="ml-1 text-slate-500 dark:text-slate-400">— {r.snippet}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          {trace.assistantText && (
            <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Agent reasoning transcript
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-200">
                {trace.assistantText}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
