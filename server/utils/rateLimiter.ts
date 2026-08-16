import type { H3Event } from "h3";
import { createError, getRequestIP, setResponseHeader } from "h3";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref?.();

interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

// PENTING: set true HANYA kalau app ini berjalan di belakang reverse proxy
// tepercaya (Nginx/Cloudflare/dll) yang men-overwrite X-Forwarded-For.
// Kalau server diakses langsung dari internet, WAJIB false — kalau tidak,
// rate limit bisa di-bypass dengan memalsukan header ini.
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

function resolveIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: TRUST_PROXY }) || "unknown";
}

export function checkRateLimit(key: string, options: RateLimitOptions = {}): void {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 60 * 1000;

  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;

  if (bucket.count > maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw createError({
      statusCode: 429,
      statusMessage: `Terlalu banyak percobaan. Silakan coba lagi dalam ${retryAfterSec} detik.`,
      data: { retryAfterSec },
    });
  }
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function rateLimitByIpAndIdentifier(
  event: H3Event,
  identifier: string,
  routeLabel: string,
  options?: RateLimitOptions
): void {
  const ip = resolveIp(event);
  const key = `${routeLabel}:${ip}:${identifier.toLowerCase()}`;

  try {
    checkRateLimit(key, options);
  } catch (err: any) {
    if (err?.data?.retryAfterSec) {
      setResponseHeader(event, "Retry-After", String(err.data.retryAfterSec));
    }
    throw err;
  }
}

export function resetRateLimitByIpAndIdentifier(event: H3Event, identifier: string, routeLabel: string): void {
  const ip = resolveIp(event);
  resetRateLimit(`${routeLabel}:${ip}:${identifier.toLowerCase()}`);
}

export function rateLimitByIp(event: H3Event, routeLabel: string, options?: RateLimitOptions): void {
  const ip = resolveIp(event);
  const key = `${routeLabel}:${ip}`;

  try {
    checkRateLimit(key, options);
  } catch (err: any) {
    if (err?.data?.retryAfterSec) {
      setResponseHeader(event, "Retry-After", String(err.data.retryAfterSec));
    }
    throw err;
  }
}