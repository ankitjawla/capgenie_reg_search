'use client';

import { useRef, useState } from 'react';
import type { BankProfile, ReportRecommendation } from '@/lib/types';
import { explainReport, findCatalogIdByName } from '@/lib/rules-debug';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  profile: BankProfile;
  reports: ReportRecommendation[];
}

export default function FollowupChat({ profile, reports }: Props) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;
    setInput('');
    setError(null);
    setHistory((h) => [...h, { role: 'user', content: question }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    // Client-side shortcut: if the question is "why isn't X here?" / "explain X",
    // run the rules engine directly and show the boolean trace — no LLM call.
    const ruleHit = matchRuleQuery(question);
    if (ruleHit) {
      const explanation = explainReport(ruleHit, profile);
      if (explanation) {
        const text = `**${explanation.shortName}** (${explanation.jurisdiction}) — ${
          explanation.applies ? 'Applies' : 'Not in the recommended list'
        }\n\n${explanation.reason}`;
        setHistory((h) => {
          const copy = [...h];
          copy[copy.length - 1] = { role: 'assistant', content: text };
          return copy;
        });
        setStreaming(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, reports, history, question }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(data?.error ?? `HTTP ${res.status}`);
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
              | { type: 'text'; delta: string }
              | { type: 'done' }
              | { type: 'error'; error: string };
            if (evt.type === 'text') {
              setHistory((h) => {
                const copy = [...h];
                const last = copy[copy.length - 1];
                if (last?.role === 'assistant') {
                  copy[copy.length - 1] = { role: 'assistant', content: last.content + evt.delta };
                }
                return copy;
              });
              requestAnimationFrame(() => {
                scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight });
              });
            } else if (evt.type === 'error') {
              setError(evt.error);
            }
          } catch {
            // skip malformed chunk
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setStreaming(false);
    }
  }

  function matchRuleQuery(q: string): string | null {
    // "why isn't FFIEC 101 here?" / "explain FR Y-14A" / "does this bank file
    // PRA110?" — extract the report name and look it up in the catalog.
    const lower = q.toLowerCase();
    const isWhyish =
      lower.includes('why') ||
      lower.includes('explain') ||
      lower.includes('does this bank file') ||
      lower.includes("isn't") ||
      lower.startsWith('is ');
    if (!isWhyish) return null;
    // Drop common stop words then probe each remaining token / 2-token combo
    // against the catalog by short or full name.
    const tokens = q
      .replace(/[?.,]/g, ' ')
      .split(/\s+/)
      .filter((t) => t && !STOP_WORDS.has(t.toLowerCase()));
    // Try longest n-gram first.
    for (let n = Math.min(5, tokens.length); n >= 1; n--) {
      for (let i = 0; i + n <= tokens.length; i++) {
        const phrase = tokens.slice(i, i + n).join(' ');
        if (findCatalogIdByName(phrase)) return phrase;
      }
    }
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 no-print">
      <details className="group" open={history.length > 0}>
        <summary className="flex cursor-pointer list-none items-baseline justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ask CapGenie</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Follow-up questions answered from the profile and reports above.
            </p>
          </div>
          <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
        </summary>
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <div
            ref={scrollerRef}
            className="mb-3 max-h-80 overflow-y-auto space-y-3 text-sm"
          >
            {history.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400">
                Try: &ldquo;Why isn&apos;t FFIEC 101 in the list?&rdquo; · &ldquo;What triggers the EU AnaCredit requirement?&rdquo; · &ldquo;Which of these are daily filings?&rdquo;
              </p>
            )}
            {history.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 ${
                  m.role === 'user'
                    ? 'bg-brand-50 text-slate-800 dark:bg-brand-900/30 dark:text-slate-100'
                    : 'bg-slate-50 text-slate-800 dark:bg-slate-800/60 dark:text-slate-100'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {m.role === 'user' ? 'You' : 'CapGenie'}
                </div>
                <div className="whitespace-pre-wrap">{m.content || (m.role === 'assistant' && streaming ? '…' : '')}</div>
              </div>
            ))}
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                {error}
              </div>
            )}
          </div>
          <form onSubmit={send} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              placeholder={streaming ? 'Thinking…' : 'Ask a follow-up'}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </details>
    </section>
  );
}

const STOP_WORDS = new Set([
  'why',
  'isnt',
  "isn't",
  'is',
  'this',
  'bank',
  'here',
  'in',
  'the',
  'list',
  'a',
  'an',
  'are',
  'do',
  'does',
  'file',
  'apply',
  'applies',
  'explain',
  'about',
  'for',
  'to',
  'of',
  'and',
  'or',
  'should',
]);
