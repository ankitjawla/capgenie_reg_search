// Simple per-IP token-bucket rate limiter. In-memory — fine for single-
// instance dev / Vercel serverless within the same warm container; lossy
// across cold starts which is acceptable since we're protecting Azure costs
// on the order of seconds, not enforcing a hard SLA.

export interface RateLimitOptions {
  capacity: number; // max tokens
  refillPerSec: number; // tokens added per second
  windowLabel?: string; // for diagnostics
}

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: opts.capacity, updatedAt: now };
    buckets.set(key, b);
  }
  // Refill
  const elapsedSec = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsedSec * opts.refillPerSec);
  b.updatedAt = now;
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { allowed: true, remaining: Math.floor(b.tokens), retryAfterSec: 0 };
  }
  const needed = 1 - b.tokens;
  const retryAfterSec = Math.ceil(needed / opts.refillPerSec);
  return { allowed: false, remaining: 0, retryAfterSec };
}

/**
 * Pull the client IP out of a Next.js Request.
 *
 * On Vercel we prefer `x-vercel-forwarded-for` which Vercel sets after its
 * single trusted edge proxy — unlike `x-forwarded-for`, this header cannot
 * be spoofed by the end client (Vercel overwrites it).
 *
 * Locally / in tests we fall back to `x-forwarded-for` then the
 * anonymous bucket so everything still works.
 */
export function getClientKey(req: Request): string {
  const vercelFwd = req.headers.get('x-vercel-forwarded-for');
  if (vercelFwd) return vercelFwd.split(',')[0].trim();
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'anonymous';
}
