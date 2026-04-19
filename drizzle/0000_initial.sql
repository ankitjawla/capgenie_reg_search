-- Initial migration for CapGenie persistence (Neon / Postgres).
-- Generate with: npx drizzle-kit generate
-- Apply with:  psql "$DATABASE_URL" -f drizzle/0000_initial.sql
--           OR via the Neon console SQL runner.

CREATE TABLE IF NOT EXISTS "analyses" (
  "id"                BIGSERIAL PRIMARY KEY,
  "cache_key"         TEXT        NOT NULL,
  "bank_name"         TEXT        NOT NULL,
  "profile"           JSONB       NOT NULL,
  "reports"           JSONB       NOT NULL,
  "trace"             JSONB,
  "warnings"          JSONB,
  "generated_at_iso"  TEXT        NOT NULL,
  "expires_at"        TIMESTAMPTZ NOT NULL,
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "analyses_cache_key_idx" ON "analyses" ("cache_key");
CREATE INDEX IF NOT EXISTS "analyses_expires_at_idx" ON "analyses" ("expires_at");
