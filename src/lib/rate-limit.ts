interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, next);
    pruneIfNeeded(now);
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: next.resetAt };
  }

  if (existing.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated: Bucket = { count: existing.count + 1, resetAt: existing.resetAt };
  buckets.set(key, updated);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - updated.count,
    resetAt: updated.resetAt,
  };
}

function pruneIfNeeded(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
