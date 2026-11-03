// Simple in-memory fixed-window rate limiter, keyed by client id.
// Note: state lives in this server process only. On serverless or multi-instance
// deployments each instance keeps its own counters; use a shared store
// (e.g. Redis/Upstash) if you need a global limit.

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const MAX_TRACKED_CLIENTS = 10_000;

export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const windows = new Map<string, Window>();

  function prune(now: number) {
    for (const [id, w] of windows) {
      if (w.resetAt <= now) windows.delete(id);
    }
  }

  return {
    check(clientId: string): RateLimitResult {
      const now = Date.now();
      if (windows.size > MAX_TRACKED_CLIENTS) prune(now);

      const current = windows.get(clientId);
      if (!current || current.resetAt <= now) {
        windows.set(clientId, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (current.count >= max) {
        return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
      }

      current.count++;
      return { allowed: true, retryAfterSeconds: 0 };
    },
    reset() {
      windows.clear();
    },
  };
}

// Best-effort client identifier from proxy headers.
export function getClientId(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip')?.trim() || 'anonymous';
}
