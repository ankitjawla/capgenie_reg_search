// Drizzle ORM schema for the Neon-backed persistence layer.

import { pgTable, text, jsonb, timestamp, index, bigserial } from 'drizzle-orm/pg-core';
import type { AnalysisResult, AnalysisTrace, BankProfile, ReportRecommendation } from '../types';

export const analyses = pgTable(
  'analyses',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    // Normalized lookup key (lowercased bank name).
    cacheKey: text('cache_key').notNull(),
    bankName: text('bank_name').notNull(),
    // RULES_VERSION at insert time. A row only satisfies a lookup if the
    // current RULES_VERSION matches — this auto-invalidates every row when
    // we ship a rules engine or catalog change.
    rulesVersion: text('rules_version').notNull().default(''),
    profile: jsonb('profile').$type<BankProfile>().notNull(),
    reports: jsonb('reports').$type<ReportRecommendation[]>().notNull(),
    trace: jsonb('trace').$type<AnalysisTrace | null>(),
    warnings: jsonb('warnings').$type<string[] | null>(),
    generatedAtIso: text('generated_at_iso').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    cacheKeyIdx: index('analyses_cache_key_idx').on(table.cacheKey),
    expiresAtIdx: index('analyses_expires_at_idx').on(table.expiresAt),
    rulesVersionIdx: index('analyses_rules_version_idx').on(table.rulesVersion),
  }),
);

export type AnalysisRow = typeof analyses.$inferSelect;
export type NewAnalysisRow = typeof analyses.$inferInsert;

export function rowToAnalysisResult(row: AnalysisRow): AnalysisResult {
  return {
    profile: row.profile,
    reports: row.reports,
    trace: row.trace ?? undefined,
    warnings: row.warnings ?? undefined,
    generatedAtIso: row.generatedAtIso,
  };
}
