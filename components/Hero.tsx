'use client';

import BankForm from './BankForm';

interface Props {
  onSubmit: (bankName: string) => void;
  loading: boolean;
}

const HOW_IT_WORKS = [
  { icon: '🧭', title: 'Plan', text: 'The agent picks which jurisdictions to investigate.' },
  { icon: '🔎', title: 'Research', text: 'Four parallel sub-agents probe US, UK, EU, and India primary sources.' },
  { icon: '✅', title: 'Verify', text: 'A verifier cross-checks the high-stakes facts before synthesis.' },
  { icon: '📋', title: 'Map to reports', text: 'Deterministic rules engine maps the profile to a curated 28-report catalog.' },
];

export default function Hero({ onSubmit, loading }: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-50 p-6 shadow-sm sm:p-10 dark:border-slate-700 dark:from-brand-900/20 dark:via-slate-900 dark:to-slate-900/40 print-card">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white text-2xl shadow-md">
          🏛️
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-100">
          Which reports does your bank need to file?
        </h2>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Enter a bank name. A LangGraph deep agent on Azure OpenAI will research the bank across US / UK / EU / India,
          cross-verify the key facts against primary sources, then map the profile to applicable regulatory reports.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900">
        <BankForm onSubmit={onSubmit} loading={loading} />
      </div>

      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-xl border border-slate-200 bg-white/70 p-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/50"
          >
            <div className="text-lg" aria-hidden>
              {step.icon}
            </div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
              Step {i + 1} · {step.title}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{step.text}</div>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-slate-500 dark:text-slate-400">
        Press <kbd className="rounded border border-slate-300 px-1 text-[10px] dark:border-slate-600">⌘K</kbd> any time to open the command palette.
      </p>
    </section>
  );
}
