// Lightweight in-memory rate limiting and login lockout. No Redis/Upstash is
// currently part of this stack, so this is a single-instance, best-effort
// defense against brute force — sufficient as a first line of defense, but
// note it resets on process restart and doesn't share state across instances
// if the app is ever scaled horizontally.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { windowMs, max }: { windowMs: number; max: number }
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

type LockoutEntry = { failures: number; lockedUntil: number };

const loginFailures = new Map<string, LockoutEntry>();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function isLoginLocked(key: string): { locked: boolean; retryAfterMs: number } {
  const entry = loginFailures.get(key);
  if (!entry) return { locked: false, retryAfterMs: 0 };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }
  if (entry.lockedUntil !== 0 && entry.lockedUntil <= now) {
    // Lockout expired — reset.
    loginFailures.delete(key);
  }
  return { locked: false, retryAfterMs: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const entry = loginFailures.get(key) ?? { failures: 0, lockedUntil: 0 };
  entry.failures += 1;
  if (entry.failures >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginFailures.set(key, entry);
}

export function clearLoginFailures(key: string): void {
  loginFailures.delete(key);
}

export function getClientIp(headers: { get(name: string): string | null }): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}
