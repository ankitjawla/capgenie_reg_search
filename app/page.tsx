'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import BankForm from '@/components/BankForm';
import ProfileCard from '@/components/ProfileCard';
import EditableProfileForm from '@/components/EditableProfileForm';
import ReportsList from '@/components/ReportsList';
import FilingCalendar from '@/components/FilingCalendar';
import ResearchTranscript from '@/components/ResearchTranscript';
import FollowupChat from '@/components/FollowupChat';
import ProgressGraph from '@/components/ProgressGraph';
import CommandPalette from '@/components/CommandPalette';
import {
  ReportsByJurisdictionChart,
  ReportsByFrequencyChart,
  AssetsByJurisdictionChart,
} from '@/components/charts';
import { applyRules } from '@/lib/rules';
import type { AnalysisResult, BankProfile } from '@/lib/types';
import {
  clearPersistedAnalysis,
  loadPersistedAnalysis,
  savePersistedAnalysis,
} from '@/lib/persistence';
import { buildShareUrl, readShareFromLocation } from '@/lib/share';

interface ProgressEvent {
  kind: 'search' | 'text' | 'info';
  text: string;
}

type Tab = 'reports' | 'calendar';
type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'capgenie:theme';

function applyTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  const effective =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;
  document.documentElement.classList.toggle('dark', effective === 'dark');
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState<string>('');
  const [apiResult, setApiResult] = useState<AnalysisResult | null>(null);
  const [editedProfile, setEditedProfile] = useState<BankProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [tab, setTab] = useState<Tab>('reports');
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [shareCopied, setShareCopied] = useState(false);
  const hydratedRef = useRef(false);

  const profile = editedProfile ?? apiResult?.profile ?? null;
  const reports = useMemo(() => (profile ? applyRules(profile) : []), [profile]);
  const warnings = useMemo(() => {
    if (!profile) return undefined;
    const w: string[] = [];
    if (profile.assetSizeTier === 'unknown') {
      w.push('Asset size is unknown; report thresholds may be approximate.');
    }
    if (profile.presence.length === 0) {
      w.push('No regulated presence in US, UK, EU, or India — the rules engine will return nothing.');
    }
    return w.length ? w : undefined;
  }, [profile]);

  // --- theme hydration + persistence ---
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && window.localStorage.getItem(THEME_KEY)) as Theme | null;
    const initial = stored ?? 'system';
    setTheme(initial);
    applyTheme(initial);
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((window.localStorage.getItem(THEME_KEY) ?? 'system') === 'system') applyTheme('system');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  function setThemeAndPersist(next: Theme) {
    setTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  }

  // --- share-link hydration (on first mount only) ---
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const share = readShareFromLocation();
    if (share) {
      setBankName(share.bankName);
      if (share.editedProfile) {
        setEditedProfile(share.editedProfile);
      }
      void runAnalysis(share.bankName);
      return;
    }
    const persisted = loadPersistedAnalysis();
    if (persisted) {
      setBankName(persisted.bankName);
      if (persisted.apiResult) setApiResult(persisted.apiResult);
      if (persisted.editedProfile) setEditedProfile(persisted.editedProfile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- persist on change ---
  useEffect(() => {
    if (!bankName) return;
    savePersistedAnalysis({
      bankName,
      apiResult: apiResult ?? undefined,
      editedProfile: editedProfile ?? undefined,
      savedAtIso: new Date().toISOString(),
    });
  }, [bankName, apiResult, editedProfile]);

  async function runAnalysis(name: string) {
    setLoading(true);
    setError(null);
    setApiResult(null);
    setEditedProfile(null);
    setEditMode(false);
    setProgress([]);
    setBankName(name);

    try {
      const res = await fetch('/api/analyze/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName: name }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(data?.error ?? `Request failed with status ${res.status}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim()) as
              | { type: 'search'; query: string }
              | { type: 'text'; delta: string }
              | { type: 'info'; message: string }
              | { type: 'result'; result: AnalysisResult }
              | { type: 'error'; error: string };
            if (evt.type === 'search') {
              setProgress((p) => [...p, { kind: 'search', text: `Searching: ${evt.query}` }]);
            } else if (evt.type === 'text') {
              setProgress((p) => {
                const last = p[p.length - 1];
                if (last && last.kind === 'text') {
                  return [...p.slice(0, -1), { kind: 'text', text: last.text + evt.delta }];
                }
                return [...p, { kind: 'text', text: evt.delta }];
              });
            } else if (evt.type === 'info') {
              setProgress((p) => [...p, { kind: 'info', text: evt.message }]);
            } else if (evt.type === 'result') {
              setApiResult(evt.result);
            } else if (evt.type === 'error') {
              setError(evt.error);
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function handleSaveEdits(next: BankProfile) {
    setEditedProfile(next);
    setEditMode(false);
  }
  function handleResetEdits() {
    setEditedProfile(null);
    setEditMode(false);
  }
  function handleClearPersisted() {
    clearPersistedAnalysis();
    setApiResult(null);
    setEditedProfile(null);
    setEditMode(false);
    setBankName('');
    setError(null);
    setProgress([]);
  }
  async function handleCopyShareLink() {
    if (!bankName) return;
    const url = buildShareUrl({
      bankName,
      editedProfile: editedProfile ?? undefined,
    });
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      window.prompt('Copy this share link:', url);
    }
  }

  const isEdited = editedProfile !== null;
  const trace = apiResult?.trace;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="mb-8 flex items-start justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">CapGenie</h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Regulatory Report Advisor
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
            Enter a bank name. A LangGraph deep agent (Azure OpenAI + Bing) researches the bank, cross-verifies the key
            facts, and lists the regulatory reports it most likely needs to file across US, UK, EU, and India.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setThemeAndPersist(e.target.value as Theme)}
            aria-label="Theme"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <Link
            href="/compare"
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            Compare
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm no-print dark:border-slate-700 dark:bg-slate-900">
        <BankForm onSubmit={runAnalysis} loading={loading} />
      </div>

      {(loading || progress.length > 0) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm no-print dark:border-slate-700 dark:bg-slate-900"
            aria-live="polite"
          >
            {loading && (
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <span className="text-sm">Researching {bankName || 'the bank'}…</span>
              </div>
            )}
            {progress.length > 0 && (
              <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm">
                {progress.slice(-30).map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span
                      className={`mt-0.5 inline-block h-2 w-2 flex-none rounded-full ${
                        p.kind === 'search'
                          ? 'bg-blue-500'
                          : p.kind === 'info'
                          ? 'bg-slate-400'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className={p.kind === 'text' ? 'text-slate-600 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                      {p.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="no-print">
            <ProgressGraph
              infoLog={progress.filter((p) => p.kind === 'info').map((p) => p.text)}
              done={!loading}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 no-print dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-200">
          <div className="font-semibold">Something went wrong</div>
          <div className="mt-1 whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {profile && (
        <div className="mt-8 space-y-6">
          {warnings && warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
              <div className="font-semibold">Notes</div>
              <ul className="mt-1 list-disc pl-5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {isEdited && (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/60 p-3 text-sm text-brand-800 no-print dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-100">
              <span>Profile has been edited — reports reflect your changes, not the original research.</span>
              <button
                type="button"
                onClick={handleResetEdits}
                className="rounded-md border border-brand-300 bg-white px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/40 dark:text-brand-100"
              >
                Reset to research
              </button>
            </div>
          )}

          {editMode ? (
            <EditableProfileForm
              profile={profile}
              onSave={handleSaveEdits}
              onCancel={() => setEditMode(false)}
            />
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="absolute right-4 top-4 z-10 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 no-print dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Edit profile
              </button>
              <ProfileCard profile={profile} />
            </div>
          )}

          {/* Toolbar: tabs + transcript + share + clear */}
          <div className="flex flex-wrap items-center justify-between gap-2 no-print">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              {(['reports', 'calendar'] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    tab === t
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100'
                  }`}
                >
                  {t === 'reports' ? 'Reports' : 'Filing calendar'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {trace && (
                <button
                  type="button"
                  onClick={() => setTranscriptOpen(true)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Research transcript ({trace.searches.length})
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                {shareCopied ? 'Copied!' : 'Copy share link'}
              </button>
              <button
                type="button"
                onClick={handleClearPersisted}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Clear saved
              </button>
            </div>
          </div>

          {/* Visual analytics — adapts to which tab is active */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ReportsByJurisdictionChart reports={reports} />
            <ReportsByFrequencyChart reports={reports} />
            <AssetsByJurisdictionChart profile={profile} />
          </div>

          <div id={tab === 'reports' ? 'reports' : 'calendar'}>
            {tab === 'reports' ? (
              <ReportsList reports={reports} bankName={bankName} profile={profile} />
            ) : (
              <FilingCalendar reports={reports} />
            )}
          </div>

          <div id="chat">
            <FollowupChat profile={profile} reports={reports} />
          </div>

          <footer className="pt-2 text-xs text-slate-400 dark:text-slate-500">
            {apiResult
              ? `Generated ${new Date(apiResult.generatedAtIso).toLocaleString()}`
              : 'Local recompute'}
            {apiResult?.fromCache ? ' · cached' : ''} · This tool is advisory only. Verify applicability with your
            compliance team before filing.
          </footer>
        </div>
      )}

      {trace && (
        <ResearchTranscript trace={trace} open={transcriptOpen} onClose={() => setTranscriptOpen(false)} />
      )}

      <CommandPalette
        savedBanks={bankName ? [{ bankName, savedAtIso: new Date().toISOString() }] : []}
        onAnalyze={(name) => {
          void runAnalysis(name);
        }}
        onTheme={setThemeAndPersist}
        onTab={setTab}
        onCompare={() => {
          window.location.href = '/compare';
        }}
        onTranscript={() => setTranscriptOpen(true)}
        onExportCsv={() => {
          // Switch to reports tab; the user can click the Export CSV button there.
          setTab('reports');
          requestAnimationFrame(() => {
            document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' });
          });
        }}
        onClearSaved={handleClearPersisted}
      />

      {/* Sticky in-page nav — only when there are results */}
      {profile && (
        <nav className="fixed bottom-4 left-1/2 z-30 hidden -translate-x-1/2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs shadow-lg backdrop-blur sm:block no-print dark:border-slate-700 dark:bg-slate-900/90">
          <ul className="flex items-center gap-3">
            <li>
              <a href="#profile" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
                Profile
              </a>
            </li>
            <li className="text-slate-300 dark:text-slate-600">·</li>
            <li>
              <a href="#reports" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
                Reports
              </a>
            </li>
            <li className="text-slate-300 dark:text-slate-600">·</li>
            <li>
              <a href="#chat" className="text-slate-600 hover:text-brand-600 dark:text-slate-300">
                Chat
              </a>
            </li>
            {trace && (
              <>
                <li className="text-slate-300 dark:text-slate-600">·</li>
                <li>
                  <button
                    type="button"
                    onClick={() => setTranscriptOpen(true)}
                    className="text-slate-600 hover:text-brand-600 dark:text-slate-300"
                  >
                    Transcript
                  </button>
                </li>
              </>
            )}
            <li className="text-slate-300 dark:text-slate-600">·</li>
            <li>
              <kbd className="rounded border border-slate-300 px-1 text-[10px] text-slate-500 dark:border-slate-600 dark:text-slate-400">
                ⌘K
              </kbd>
            </li>
          </ul>
        </nav>
      )}
    </main>
  );
}
