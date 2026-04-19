# CapGenie operational runbook

Production URL: https://capgenie-reg-search.vercel.app
Repo: https://github.com/ankitjawla/capgenie_reg_search
Vercel project: `ankitjawlas-projects/capgenie-reg-search`

## Quick health check

```bash
curl -fsS https://capgenie-reg-search.vercel.app/api/health | jq
# Expected: {"status":"ok","env":{"azure":true,"search":true,"searchProvider":"tavily"}, ...}
```

If `status == "degraded"` the health endpoint tells you which env var is missing.

## Architecture

- Next.js 14 on Vercel (serverless)
- Azure OpenAI (deployment: see env) for the deep-agent via LangGraph
- Tavily (primary) / SerpAPI (fallback) for `web_search`
- Neon Postgres via Drizzle ORM for the analysis cache + history
  (falls back to in-memory if `DATABASE_URL` is unset)
- Sentry (optional) via `@sentry/nextjs` for error monitoring
- Vercel log explorer always available via `vercel logs capgenie-reg-search`

## Playbook: common incidents

### 1) `/api/analyze/stream` returns `{kind:"auth"}`

Either Azure OpenAI key is invalid or Tavily/SerpAPI key is invalid.

1. Ping `/api/health` — confirms which provider is configured.
2. Rotate the bad key in Azure portal / Tavily dashboard / SerpAPI dashboard.
3. Update the corresponding Vercel env var: `vercel env add AZURE_OPENAI_API_KEY production`
4. Redeploy: `vercel --prod` (or wait for the next push to auto-deploy).
5. Verify by re-running the analysis.

### 2) Analyses are slow / timing out

- The multi-node deep agent runs 4 (US/UK/EU/IN) or 7 (+CA/SG/HK) research sub-agents in parallel. Typical wall-clock: 60–180 s.
- If `/api/analyze/stream` hits Vercel's 180 s `maxDuration` cap, consider:
  - Reducing `recursionLimit: 60` in [lib/llm.ts](../lib/llm.ts).
  - Trimming per-researcher max `web_search` calls in [lib/agent/graph.ts](../lib/agent/graph.ts).
  - Asking the planner to probe fewer jurisdictions (adjust planner prompt).

### 3) Azure OpenAI rate limit (`{kind:"rate_limit"}`)

- Vercel logs: `vercel logs capgenie-reg-search --since 15m | grep rate_limit`
- Real fix: increase the deployment's TPM quota in Azure.
- Workaround: app already has per-IP rate limiting (5 analyses/min). Raise if the deployment's TPM allows.

### 4) Neon DB is down

- The app falls back to in-memory cache automatically — user-visible impact is just loss of history + loss of cache across cold starts.
- Check Neon status: https://neonstatus.com
- If extended: Neon supports read-replicas and branching for mitigation.

### 5) Sentry isn't receiving events

- Check the `SENTRY_DSN` env var is set on Vercel.
- Check `sentry.client.config.ts` and `sentry.server.config.ts` guard on DSN — no DSN = no-op.
- Emit a test event: `Sentry.captureException(new Error("smoke-test"))` from a temporary endpoint.

### 6) Deploy failing

1. Check the GitHub Actions CI run: https://github.com/ankitjawla/capgenie_reg_search/actions
2. If CI is green but Vercel fails: `vercel inspect <deploy-url> --logs`
3. Most common cause: env var mismatch. Confirm `vercel env ls` lists all of AZURE_OPENAI_* + TAVILY_API_KEY + DATABASE_URL.

## Rollback

```bash
# List recent production deploys
vercel ls capgenie-reg-search

# Promote a previous deploy back to the production alias
vercel promote https://capgenie-reg-search-<id>-ankitjawlas-projects.vercel.app --scope=ankitjawlas-projects
```

## Useful commands

```bash
# Tail logs
vercel logs capgenie-reg-search --since 10m

# Re-run UI health check against prod
npm run ui-check:prod

# Locally verify the DB layer
DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d= -f2-) npx drizzle-kit studio

# Apply the initial DB migration
psql "$DATABASE_URL" -f drizzle/0000_initial.sql
```
