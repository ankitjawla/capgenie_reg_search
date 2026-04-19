# CapGenie Service Level Objectives

These are **targets**, not hard guarantees. They inform alerting thresholds and release-gating discussions.

## Availability (Tier-1)

| SLI | SLO (30-day window) | Budget |
|---|---|---|
| `GET /api/health` returns 2xx | 99.9 % | 43 m / month |
| Page load on `/` returns 2xx | 99.5 % | 3 h 39 m / month |
| `POST /api/analyze/stream` starts streaming within 10 s | 99.0 % | 7 h 18 m / month |

## Latency (p95)

| Operation | SLO |
|---|---|
| `/api/health` | < 200 ms |
| Static page load on `/` | < 1.5 s First Contentful Paint |
| First SSE event from `/api/analyze/stream` | < 5 s |
| Full analysis (planner → synthesizer) **not cached** | < 180 s |
| Full analysis **cached** (DB hit) | < 500 ms |

## Correctness

| SLI | SLO |
|---|---|
| Unit tests passing on `main` | 100 % |
| UI Health Check agent against prod | 100 % |
| Analyses that produce a non-empty `BankProfile` (i.e. agent didn't fail) | ≥ 95 % |

## Cost guardrails

- Per-IP rate limit: 5 analyses/min, 20 chat messages/min
- 24h cache TTL (DB) keeps recurring lookups free
- Tavily: stay under the 1000/month free tier — assume 6 searches per analysis → ~165 fresh analyses/month before needing a paid tier
- Azure OpenAI: monitor TPM utilization; upgrade to higher tier if p95 wait time exceeds 5 s regularly

## Alerting (recommended, not yet wired)

When we add a monitoring provider:
- Page on `/api/health` non-2xx for 3 consecutive minutes
- Page on Sentry error rate > 5 errors/min sustained 5 min
- Warn on analyze p95 > 200 s sustained 15 min

## Reviewing the budget

Error budget is reviewed **monthly**. If we burn > 80 % of budget mid-month, any new deploy requires a smoke-test-pass + sign-off.
