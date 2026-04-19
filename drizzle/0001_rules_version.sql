-- Add rules_version column + index so a rules-engine / catalog change
-- automatically invalidates every cached analysis.

ALTER TABLE "analyses"
  ADD COLUMN IF NOT EXISTS "rules_version" TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS "analyses_rules_version_idx" ON "analyses" ("rules_version");
