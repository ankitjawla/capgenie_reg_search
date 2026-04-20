# CapGenie deferred backlog

Items from the code review that are **real** and **worth doing**, but each
deserves its own dedicated round. Keeping them here so they don't get lost.

## Canonicalize the cache key by entity, not string

**Why it matters.** Today `lib/db/index.ts` keys on `trim().toLowerCase(bankName)` +
`RULES_VERSION`. That means `"JPM"`, `"JP Morgan"`, and `"JPMorgan Chase"` all
miss the cache for each other. Worse, two spellings of the same bank =
two full Azure + Tavily runs.

**Approach.**
1. Add a lightweight identity-resolution step at the start of the planner
   that hits the GLEIF LEI API (free, no auth) with the user's input.
2. Cache the `(input_text → LEI)` mapping in a `bank_aliases` table.
3. Key the main `analyses` cache on `(rulesVersion, lei ?? normalized_text)`.
4. Bonus: the LEI also fixes disambiguation (the review's separate point).

## Per-node exponential backoff + retry on Bing 429 / 5xx

**Why it matters.** One Tavily 429 currently kills a jurisdiction — the
researcher reports "failed" and the synthesizer proceeds with partial data.

**Approach.** In `lib/agent/tools.ts` wrap `bingWebSearch` in a retry with
jitter: 3 attempts, 500 ms → 2 s → 8 s, only for 429 + 5xx. Node-level
timeout of 20 s per researcher via `Promise.race` against `AbortSignal`.

## Rules engine content gaps

The review flagged real holes in each jurisdiction's coverage. Each is ~half
a day of research + catalog + rules + tests:

- **US**: FR 2510 (non-bank structural info); FR Y-14M should also respect
  tailoring Categories I–IV, not just mortgage/CC activity; FBO-specific
  IHC rules are not modeled.
- **EU**: CRR3 output-floor reporting and its phase-in schedule; SSM direct
  supervision vs. LSI (less-significant institution) split is not reflected.
- **UK**: ring-fence threshold is hard-coded at ~$32B; should be stored as
  GBP and converted at query time against a pinned recent rate.
- **India**: HRGN (High-Risk Group NBFC) classification; revised CRILC
  weekly SMA cadence.

## Parametric rule-test matrix + golden fixtures

`lib/rules.test.ts` has 15 cases. Add:
- A parametric matrix: `sizeTier × jurisdiction × activityMix`.
- Golden fixtures for JPM, HDFC, Barclays, DBS, RBC, HSBC — stored as JSON
  snapshots of the full `ReportRecommendation[]`. A diff test asserts the
  current engine produces byte-identical output; any real rule change
  requires an explicit snapshot update, so silent regressions on a real
  bank become impossible.

## Share-link freshness

`lib/share.ts` encodes `{bankName, editedProfile}` but not `rulesVersion` or
`generatedAtIso`. If rules ship an update, an old share link reloads to a
mismatched view. Add both to the payload; on `page.tsx` mount, if
`share.rulesVersion !== RULES_VERSION` show a banner: "This link was
generated against rules *v1*; current is *v2* — re-run analysis to refresh."

## Focus management + keyboard-only tests

`components/FollowupChat.tsx` and `components/CommandPalette.tsx` open
modal-like surfaces without (a) auto-focusing the first interactive element
on open or (b) trapping focus on close. axe-core doesn't catch this.

Add:
- `useRef` + `ref.current?.focus()` in a `useEffect` on open.
- A `focus-trap-react` wrapper (or manual `keydown` handler) for tab cycling.
- A Playwright keyboard-only test journey: tab into the form, submit, tab
  through the results, open palette, close it — assert focus never leaves
  visible elements.

## Evidence-citation sub-agent (was planned as Phase R3)

**Why deferred.** The Phase R3 design adds a new node to the LangGraph
between `verifier` and `synthesizer` that cross-links each rules-engine
recommendation back to a specific regulation section. This requires:
- a new Zod `CitationBundle` schema propagated through graph state
- a restructured synthesizer (draft → annotate → final)
- UI drawer updates to render `citation.regulationSection` + `quote`

Non-trivial graph + schema changes that risk destabilizing the current
multi-node flow. Decoupling it from the regulator-browser round keeps the
release safe. Ship as its own follow-up.

**Trigger criteria.** Revisit when (a) users frequently ask "where does
this rule come from?" or (b) we ship a two-model diff that needs cite-level
evidence to compare.

## Build-time regulator bio generation (was planned)

**Why deferred.** Script is straightforward but requires a new
`scripts/generate-regulator-bios.ts` + `build:bios` npm script + Vercel
build-phase setup. The hardcoded bios in `lib/regulators.ts` are already
good (~2–3 sentences each) and cost nothing. The LLM-generated path only
matters if we later want to refresh bios periodically or expand to
50+ regulators.

## Sentry spans per graph node

Today Sentry captures exceptions. To see *which* researcher is slow, wrap
each node in `Sentry.startSpan({ name: 'agent.researcher.US' })` and tag
spans with `bankName, requestId, jurisdiction`. Emits Sentry Performance
traces that show the full graph run as a flame chart.

## On-call / paging wiring

[docs/ONCALL.md](./ONCALL.md) has the playbook. Pulling the trigger needs
a PagerDuty or Better Stack account — a real action the operator does
once, then we wire the Sentry integration.

---

Priorities for the next round, picked for highest "value × cheapness":
1. LEI canonical cache key (prevents token waste on every re-spelling).
2. Parametric rule-test matrix + golden fixtures (prevents silent regressions).
3. Bing retry/backoff (prevents single-429 failures).
4. Share-link freshness banner (5-minute diff).
