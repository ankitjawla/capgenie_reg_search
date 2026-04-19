// Neon-backed persistence with a graceful fallback.
//
// If DATABASE_URL is set, we hit Neon via the HTTP serverless driver — no
// connection pool needed, works on Vercel's edge/serverless runtime.
// If unset (local dev without Neon, CI smoke runs, etc.) we fall back to
// an in-memory Map so the app still works; cache entries are just lost
// between cold starts.

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, desc, eq, gt, lt } from 'drizzle-orm';
import { analyses, rowToAnalysisResult, type NewAnalysisRow } from './schema';
import type { AnalysisResult } from '../types';
import { logJson } from '../errors';

const DATABASE_URL = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const dbEnabled = DATABASE_URL !== null;

const db = dbEnabled
  ? drizzle(neon(DATABASE_URL!), { schema: { analyses } })
  : null;

// In-memory fallback — identical semantics to the previous per-route Map.
interface MemEntry {
  result: AnalysisResult;
  expiresAt: number;
}
const mem = new Map<string, MemEntry>();

function cacheKey(bankName: string): string {
  return bankName.trim().toLowerCase();
}

export async function cacheGet(bankName: string): Promise<AnalysisResult | null> {
  const key = cacheKey(bankName);
  const now = Date.now();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(analyses)
        .where(and(eq(analyses.cacheKey, key), gt(analyses.expiresAt, new Date(now))))
        .orderBy(desc(analyses.createdAt))
        .limit(1);
      if (rows.length === 0) return null;
      return rowToAnalysisResult(rows[0]);
    } catch (e) {
      logJson({
        level: 'warn',
        route: 'db.cacheGet',
        msg: 'db.read_failed_falling_back_to_mem',
        err: (e as Error).message,
      });
    }
  }

  const m = mem.get(key);
  if (m && m.expiresAt > now) return m.result;
  return null;
}

export async function cachePut(bankName: string, result: AnalysisResult): Promise<void> {
  const key = cacheKey(bankName);
  const now = Date.now();
  const expiresAt = new Date(now + CACHE_TTL_MS);

  if (db) {
    try {
      const row: NewAnalysisRow = {
        cacheKey: key,
        bankName,
        profile: result.profile,
        reports: result.reports,
        trace: result.trace ?? null,
        warnings: result.warnings ?? null,
        generatedAtIso: result.generatedAtIso,
        expiresAt,
      };
      await db.insert(analyses).values(row);
      return;
    } catch (e) {
      logJson({
        level: 'warn',
        route: 'db.cachePut',
        msg: 'db.write_failed_falling_back_to_mem',
        err: (e as Error).message,
      });
    }
  }

  mem.set(key, { result, expiresAt: now + CACHE_TTL_MS });
}

/**
 * Return up to `limit` previous analyses for a given bank name, newest
 * first. Used by the History view.
 */
export async function analysisHistory(bankName: string, limit = 10) {
  const key = cacheKey(bankName);
  if (db) {
    try {
      const rows = await db
        .select({
          id: analyses.id,
          bankName: analyses.bankName,
          generatedAtIso: analyses.generatedAtIso,
          createdAt: analyses.createdAt,
          profile: analyses.profile,
          reportCount: analyses.reports,
        })
        .from(analyses)
        .where(eq(analyses.cacheKey, key))
        .orderBy(desc(analyses.createdAt))
        .limit(limit);
      return rows.map((r) => ({
        id: r.id,
        bankName: r.bankName,
        generatedAtIso: r.generatedAtIso,
        createdAtIso: r.createdAt.toISOString(),
        assetSizeTier: r.profile.assetSizeTier,
        reportCount: r.reportCount.length,
      }));
    } catch (e) {
      logJson({
        level: 'warn',
        route: 'db.analysisHistory',
        msg: 'db.history_failed',
        err: (e as Error).message,
      });
    }
  }
  return [];
}

export async function pruneExpired(): Promise<number> {
  if (!db) return 0;
  try {
    const res = await db.delete(analyses).where(lt(analyses.expiresAt, new Date())).returning({
      id: analyses.id,
    });
    return res.length;
  } catch (e) {
    logJson({
      level: 'warn',
      route: 'db.pruneExpired',
      msg: 'db.prune_failed',
      err: (e as Error).message,
    });
    return 0;
  }
}
