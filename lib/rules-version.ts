// Version tag for the rules engine + reports catalog. Bump this whenever
// rules.ts or reports-catalog.ts changes in a way that would produce a
// different result for the same BankProfile.
//
// The cache key incorporates this so a rule update invalidates every stale
// entry without manually pruning the `analyses` table.

export const RULES_VERSION = '2026-04-19-v1';
