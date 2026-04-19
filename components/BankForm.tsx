'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (bankName: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  'JPMorgan Chase',
  'HDFC Bank',
  'Barclays',
  'Deutsche Bank',
  'State Bank of India',
  'Goldman Sachs',
];

export default function BankForm({ onSubmit, loading }: Props) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="bank" className="block text-sm font-medium text-slate-700 mb-2">
        Bank name
      </label>
      <div className="flex gap-2">
        <input
          id="bank"
          type="text"
          autoFocus
          disabled={loading}
          placeholder="e.g. HDFC Bank, JPMorgan Chase, Barclays"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || name.trim().length === 0}
          className="rounded-lg bg-brand-600 px-5 py-3 text-base font-semibold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        <span>Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => setName(ex)}
            className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}
