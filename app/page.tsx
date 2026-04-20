import Link from 'next/link';
import type { Metadata } from 'next';
import { REGULATORS } from '@/lib/regulators';
import { REPORT_CATALOG } from '@/lib/reports-catalog';

export const metadata: Metadata = {
  title: 'CapGenie — Bank Regulatory Report Advisor',
  description:
    'A LangGraph deep agent on Azure OpenAI that researches a bank across seven jurisdictions, cross-verifies the key facts against primary sources, and maps the profile to applicable regulatory reports.',
};

export default function LandingPage() {
  const regulatorCount = REGULATORS.length;
  const reportCount = Object.keys(REPORT_CATALOG).length;

  return (
    <>
      {/* HERO ======================================================== */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="absolute inset-0 bg-hero-radial" aria-hidden />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
            Regulatory Report Advisor · live
          </span>

          <h1 className="mt-6 max-w-4xl font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
            Map any bank to every report it has to file.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300 sm:text-xl">
            CapGenie researches a bank across US · UK · EU · India · Canada · Singapore · Hong Kong,
            cross-verifies the key facts with primary sources, and tells you exactly which regulatory
            reports apply — with citations.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3 text-base font-bold text-white shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-600"
            >
              Start an analysis →
            </Link>
            <Link
              href="/regulators"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white backdrop-blur hover:border-brand-400 hover:bg-white/10"
            >
              Browse {regulatorCount} regulators
            </Link>
            <span className="ml-2 text-xs text-slate-400">
              No login required · public demo
            </span>
          </div>

          {/* Stats strip */}
          <div className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat value={String(regulatorCount)} label="Regulators" />
            <Stat value={String(reportCount)} label="Reports catalogued" />
            <Stat value="7" label="Jurisdictions" />
            <Stat value="28" label="Unit tests" />
          </div>
        </div>
      </section>

      {/* WHAT IT DOES ================================================ */}
      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>What it does</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Four things, end-to-end.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="🔎"
              title="Researches"
              body="A LangGraph deep agent fans out to seven parallel sub-agents — one per jurisdiction — each expert on that region's regulators. Calls Tavily / Bing for primary sources."
            />
            <FeatureCard
              icon="✅"
              title="Verifies"
              body="A verifier node cross-checks the researchers' findings against each other and against fresh searches before anything reaches the final profile."
            />
            <FeatureCard
              icon="📋"
              title="Maps to reports"
              body="A deterministic rules engine (28 unit tests + golden fixtures) converts the verified profile into the exact list of reports the bank must file."
            />
            <FeatureCard
              icon="📎"
              title="Cites evidence"
              body="An evidence-citer pass links each recommendation back to a source URL and a specific regulation section — no unverified claims."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS ================================================ */}
      <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>Under the hood</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            A multi-node deep agent. Not a prompt.
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
            Every analysis runs through a LangGraph state machine with specialized nodes — so verification is a graph-level gate, not a prompt-level hope.
          </p>

          <ol className="mt-12 space-y-4">
            <StepCard
              step="01"
              title="Planner"
              body="Reads the bank name, resolves identity (flagging name-collision risk), and decides which of the seven jurisdictions to probe and what entity type to assume (bank / insurer / crypto firm)."
            />
            <StepCard
              step="02"
              title="Researchers × 7 (parallel)"
              body="One per jurisdiction — US, UK, EU, IN, CA, SG, HK — each seeded with the regulators operating there (names, websites, bios) so it scopes queries via site: filters against primary sources."
            />
            <StepCard
              step="03"
              title="Verifier"
              body="Cross-checks the seven reports. If a jurisdiction's findings are uncited or contradictory, routes back for one retry before proceeding."
            />
            <StepCard
              step="04"
              title="Synthesizer"
              body="Produces a structured BankProfile via Zod schema. Strict-mode checks every required field is filled or explicitly null."
            />
            <StepCard
              step="05"
              title="Rules engine + evidence-citer"
              body="Pure TypeScript rules map the profile to reports. A final Azure call links each report to a citation from the researcher-cited sources."
            />
          </ol>
        </div>
      </section>

      {/* COVERAGE ==================================================== */}
      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>Coverage</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Seven jurisdictions · {regulatorCount} regulators · {reportCount} reports.
          </h2>
          <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">
            Plus three entity types — banks, insurers, crypto firms — each forking to its own rules engine.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { flag: '🇺🇸', name: 'United States' },
              { flag: '🇬🇧', name: 'United Kingdom' },
              { flag: '🇪🇺', name: 'European Union' },
              { flag: '🇮🇳', name: 'India' },
              { flag: '🇨🇦', name: 'Canada' },
              { flag: '🇸🇬', name: 'Singapore' },
              { flag: '🇭🇰', name: 'Hong Kong' },
            ].map((j) => (
              <div
                key={j.name}
                className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="text-3xl" aria-hidden>
                  {j.flag}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {j.name}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-brand-200 bg-brand-50 p-6 dark:border-brand-800/60 dark:bg-brand-900/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-brand-900 dark:text-brand-100">
                  Browse every regulator directly
                </h3>
                <p className="mt-1 text-sm text-brand-800/80 dark:text-brand-100/80">
                  FFIEC, SEC, Federal Reserve, FDIC, PRA, FCA, EBA, ECB, CBI, ACPR, AMF, RBI, MAS, HKMA, OSFI, and more — every report each one issues, with plain-English descriptions.
                </p>
              </div>
              <Link
                href="/regulators"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Open the regulator library →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID =============================================== */}
      <section className="bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>The full feature set</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Everything you get out of the box.
          </h2>

          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MiniFeature title="Live streaming SSE" body="Watch the planner → researchers → verifier → synthesizer light up in real time as the deep agent works." />
            <MiniFeature title="Editable profile" body="Edit any field the agent got wrong. The rules engine re-runs client-side — no extra LLM calls, instant reports." />
            <MiniFeature title="Filing calendar" body="Group recommended reports by cadence with a 12-month heat-map. Click a month to see what lands." />
            <MiniFeature title="Follow-up chat" body="Ask why a report isn't in the list. The client-side rules engine answers instantly; otherwise Azure handles it." />
            <MiniFeature title="Side-by-side compare" body="Run two banks in parallel, diff their reports: shared vs A-only vs B-only." />
            <MiniFeature title="Research transcript" body="Every web search the agent ran, with the snippets + URLs it read. Audit trail for every analysis." />
            <MiniFeature title="CSV export" body="One-click download of the filtered report list — RFC-4180 compliant, escaped for commas/quotes/newlines." />
            <MiniFeature title="Share link + persistence" body="Base64-encoded URL fragment shares the exact state; localStorage restores it on refresh." />
            <MiniFeature title="Command palette" body="⌘K opens a fuzzy-search palette: jump to any regulator, run an analysis, switch tab, toggle theme." />
            <MiniFeature title="Dark mode" body="Full light/dark/system theming with Tailwind class-based darkening on every component." />
            <MiniFeature title="Print-ready" body="Ctrl+P produces a clean compliance-memo layout — form and chat hidden, reports paginated." />
            <MiniFeature title="Golden-fixture tests" body="Six real banks (JPM, HDFC, Barclays, DBS, RBC, HSBC) snapshot-locked; rule regressions caught in CI." />
          </div>
        </div>
      </section>

      {/* TECH STACK ================================================== */}
      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4">
          <SectionEyebrow>Built on</SectionEyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Production-grade infrastructure.
          </h2>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StackCard title="Azure OpenAI" subtitle="gpt-5.4 deployment" />
            <StackCard title="LangGraph" subtitle="multi-node deep agent" />
            <StackCard title="Tavily" subtitle="primary web search · Bing fallback" />
            <StackCard title="Next.js 14" subtitle="App Router · RSC · SSE streaming" />
            <StackCard title="Neon Postgres" subtitle="24h analysis cache + history" />
            <StackCard title="Drizzle ORM" subtitle="typed schema + migrations" />
            <StackCard title="Sentry" subtitle="error monitoring · perf tracing" />
            <StackCard title="Vercel" subtitle="edge deploy · auto-scale" />
          </div>

          <div className="mt-10 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Badge>Zod validation</Badge>
            <Badge>Rate limiting</Badge>
            <Badge>Origin allow-list</Badge>
            <Badge>Request IDs</Badge>
            <Badge>AbortSignal end-to-end</Badge>
            <Badge>SSE heartbeats</Badge>
            <Badge>Singleflight stampede protection</Badge>
            <Badge>RULES_VERSION cache invalidation</Badge>
            <Badge>WCAG 2.1 AA</Badge>
            <Badge>Playwright UI Health Check</Badge>
          </div>
        </div>
      </section>

      {/* FINAL CTA =================================================== */}
      <section className="bg-ink-900 py-24 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
            Ready to analyze your first bank?
          </h2>
          <p className="mt-5 text-lg text-slate-300">
            Enter any name — "HSBC", "HDFC Bank", "BNP Paribas", "Allianz", "Coinbase" — and watch the deep agent run in ~60 seconds.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-accent-500/30 hover:-translate-y-0.5 hover:bg-accent-600"
            >
              Start an analysis →
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white hover:border-brand-400 hover:bg-white/10"
            >
              Compare two banks
            </Link>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            Advisory only. Verify every recommendation with your compliance team before filing.
          </p>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="text-3xl font-extrabold text-brand-400">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">{label}</div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
      <span className="h-px w-8 bg-brand-500" />
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-500">
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl group-hover:bg-brand-100 dark:bg-brand-900/40 dark:group-hover:bg-brand-900/60">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

function StepCard({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="shrink-0 font-display text-4xl font-extrabold text-brand-500">{step}</div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{body}</p>
      </div>
    </li>
  );
}

function MiniFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{body}</p>
    </div>
  );
}

function StackCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
      {children}
    </span>
  );
}
