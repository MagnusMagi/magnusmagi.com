interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + config.windowMs };
    buckets.set(key, next);
    pruneIfNeeded(now);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: next.resetAt,
    };
  }

  if (existing.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  const updated: Bucket = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  };
  buckets.set(key, updated);
  return {
    allowed: true,
    remaining: config.maxRequests - updated.count,
    resetAt: updated.resetAt,
  };
}

function pruneIfNeeded(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
