# CapGenie on-call guide

## Current state

CapGenie **does not have active paging** yet. We have:

- Vercel's built-in deployment notifications (email + Vercel dashboard)
- Sentry (optional, wires on when `SENTRY_DSN` is set)
- GitHub Actions CI status
- A manual UI Health Check you can run on demand (`npm run ui-check:prod`)

The right next step if this becomes a real-customer-pilot product is to
wire a paging provider. This doc describes how.

## Wiring PagerDuty (recommended)

1. Create a PagerDuty service named `CapGenie` and grab the Events API v2 integration key.
2. In Sentry → project settings → Integrations → PagerDuty, link the service.
3. Configure an issue-alert rule in Sentry:
   - **When**: an event is captured with level = error
   - **And**: the environment is `production`
   - **And**: the error hasn't been seen in the last 1 min (dedup)
   - **Trigger**: notify PagerDuty integration
4. Add a second alert for `/api/health` uptime:
   - Use Vercel Checks or a free pinger (e.g. Better Stack, UptimeRobot)
   - Target: `https://capgenie-reg-search.vercel.app/api/health`
   - Expected: 200 with `{status:"ok"}`
   - Ping interval: 1 min
   - Alert: after 3 consecutive failures, page PagerDuty

## Wiring Opsgenie (alternative)

Mirror the PagerDuty steps but use Opsgenie's Sentry integration.

## Wiring an inexpensive zero-cost option

Better Stack (formerly Logtail+Uptime) has a free tier:
- 10 HTTP monitors
- Email alerts
- Optional: Slack/Discord webhooks

Good enough for a pilot. Doesn't page a phone, but catches outages.

## Escalation policy (draft)

| Severity | Paging | Response time |
|---|---|---|
| SEV-1 — `/api/health` down or > 5 % error rate | Page primary on-call immediately | 15 min |
| SEV-2 — analyses failing for a single customer | File ticket + Slack notify | Next business day |
| SEV-3 — performance regression, > 50 % latency increase | Slack notify, fix in next sprint | 1 week |

## Who's on call

This is a single-maintainer project right now. Escalate to Ankit Jawla.
If we grow, this section documents the rotation.

## During an incident

1. Post in Slack: "investigating" + the affected endpoint.
2. Check [RUNBOOK.md](./RUNBOOK.md) first — most incidents are in the playbook.
3. If rolling back:
   ```
   vercel ls capgenie-reg-search            # find previous healthy deploy
   vercel promote <previous-url>            # roll back
   ```
4. After: write a short postmortem in `docs/postmortems/YYYY-MM-DD-incident.md`.
