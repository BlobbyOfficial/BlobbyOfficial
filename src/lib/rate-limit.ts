const WINDOW_MS = 60_000;
const MAX_REQUESTS = 3;

const hits = new Map<string, number[]>();

/**
 * Best-effort in-memory sliding-window limiter, keyed by IP or user id. It
 * only holds state per serverless instance (not shared across
 * regions/cold starts), so it's a speed bump against spam/flooding, not a
 * hard guarantee — an appropriate level of protection for a low-traffic
 * messaging inbox where senders already need an account.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS;
}
