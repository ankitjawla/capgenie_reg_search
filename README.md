# CapGenie — Bank Regulatory Report Advisor

A Next.js webapp that takes a **bank name** and advises which **regulatory reports** the bank most likely needs to file across the **US, UK, EU, and India**.

## How it works

1. You enter a bank name.
2. A Next.js API route streams a **LangGraph deep-agent workflow** (planner → researcher → synthesizer) powered by **Azure OpenAI (GPT-4.1 / 4o)**. The agent uses **Bing Web Search** to research the bank across US / UK / EU / India, cross-verifies the key facts against multiple primary sources, then emits a structured `BankProfile` via LangGraph's `responseFormat` (Zod schema).
3. A deterministic **rules engine** (`lib/rules.ts`) maps that profile to regulatory reports from a curated catalog (`lib/reports-catalog.ts`). Each recommendation comes with an *applicability reason*, a confidence level, and a list of `evidenceFieldIds` that trigger the rule — used to render the "Why this report?" drawer in the UI.

The UI groups reports by jurisdiction, lets users edit the profile and re-run the rules locally, supports CSV export, and streams the agent's reasoning + searches live while it works.

## Coverage

- **US**: FFIEC 031/041/051, FFIEC 002/009/101/102, FR Y-9C/9LP/9SP, FR Y-14A/Q/M, FR Y-15, FR 2052a, FR 2900, HMDA LAR, CRA, FinCEN SAR/CTR, TIC B-forms.
- **UK**: PRA110, FSA047/048, MLAR, ring-fencing returns.
- **EU**: COREP, FINREP, LCR, ALMM, AnaCredit, MiFIR transaction reporting, Pillar 3 disclosures, DORA register, FATCA/CRS.
- **India**: DSB Returns, Form A (CRR), Form VIII (SLR), Form X, BSR-1/2, CRILC, LFAR, ALM returns, LCR/NSFR, RBS/RAQ, ICAAP, Priority Sector returns, FETERS / R-Returns, FATCA/CRS (Form 61B), FIU-IND CTR/STR/NTR/CCR.

> This tool is **advisory only**. Verify applicability with your compliance team before filing anything.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your credentials

CapGenie needs **two** services:

1. **Azure OpenAI** for the deep-agent reasoning (GPT-4.1 or GPT-4o deployment).
2. **Bing Web Search v7** for the web_search tool the agent calls.

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_DEPLOYMENT=gpt-4.1           # the *deployment* name
AZURE_OPENAI_API_VERSION=2024-10-21

# Bing Web Search
BING_SEARCH_API_KEY=...
BING_SEARCH_ENDPOINT=https://api.bing.microsoft.com/v7.0/search
```

Provision both at https://portal.azure.com. Azure OpenAI billing is per-token; Bing Search S1 is ~$3 per 1k queries. CapGenie caches analyses for 24h in-memory to keep costs low.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

> **Note on env vars:** Next.js only reads `.env.local` if the variable isn't already exported in the shell. If you have an `AZURE_OPENAI_API_KEY` exported (even as an empty string), it overrides the file. Either `unset` it before running, or launch with `env -u AZURE_OPENAI_API_KEY npm run dev`.

### 4. Deploy to Vercel

```bash
npx vercel
```

Add all six env vars (Azure + Bing) to the Vercel project's Environment Variables (Production + Preview + Development), then redeploy.

## Architecture: the deep agent

```
         ┌──────────────┐
         │   PLAN       │  agent lists jurisdictions + facts to verify
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │   RESEARCH   │  web_search via Bing, once per fact per jurisdiction
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │ CROSS-VERIFY │  re-search disagreements / G-SIB / FBO status
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │ SYNTHESIZE   │  LangGraph structured-output → typed BankProfile
         └──────────────┘
```

The workflow is enforced in the system prompt and guaranteed by LangGraph's `responseFormat` (a Zod schema — `lib/agent/tools.ts`). Every search is recorded in `AnalysisTrace.searches` so the UI can render a research transcript and link each report back to its supporting sources.

In the Vercel dashboard, add `ANTHROPIC_API_KEY` as an environment variable (Production + Preview + Development), then redeploy.

## Project layout

```
app/
  layout.tsx            Root layout + Tailwind
  page.tsx              Landing page (form + results)
  api/analyze/route.ts  POST /api/analyze
components/
  BankForm.tsx          Input form
  ProfileCard.tsx       Structured bank profile
  ReportsList.tsx       Reports grouped by jurisdiction
lib/
  types.ts              BankProfile / ReportRecommendation / AnalysisResult
  reports-catalog.ts    Curated catalog of regulatory reports
  rules.ts              Deterministic attribute -> report mapping
  llm.ts                Anthropic client with web_search + structured tool
```

## Extending the rules engine

Every rule is a small function that returns either a `ReportRecommendation` or `null`. To add a new report:

1. Add the description to `lib/reports-catalog.ts`.
2. Add a rule in the appropriate `*Rules` function in `lib/rules.ts` with a plain-English applicability reason.

Because the engine is pure and deterministic, you can add unit tests against `applyRules(profile)` for well-known banks as regression checks.

## Limitations

- The tool is calibrated for the four jurisdictions above; banks with no presence in any of them will return an empty list.
- Thresholds are rounded (e.g., "≥ $100B") and intentionally err on the inclusive side; always cross-check against the current rules text.
- LLM research may misidentify banks with colliding names (e.g., "First National Bank"); the `rationale` field explains the classification and `sources` lets you audit it.
