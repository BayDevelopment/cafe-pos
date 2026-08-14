import type { H3Event } from "h3";
import { createError, getRequestIP, setResponseHeader } from "h3";

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();

// Bersihkan entri kedaluwarsa secara berkala supaya Map tidak membengkak selamanya.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
// Jangan sampai timer ini mencegah proses Node.js exit dengan bersih.
cleanupTimer.unref?.();

interface RateLimitOptions {
  maxAttempts?: number; // default 5
  windowMs?: number; // default 60_000 (1 menit)
}

/**
 * Cek & increment rate limit untuk sebuah key. Melempar 429 kalau sudah melebihi batas.
 * Panggil ini di AWAL handler, sebelum proses autentikasi/logic lain berjalan.
 */
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

/** Panggil setelah percobaan BERHASIL (login sukses, reset password sukses), supaya counter langsung bersih. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Helper untuk endpoint yang butuh rate limit berbasis kombinasi IP + identifier
 * (mis. IP + email), supaya satu penyerang tidak bisa mengunci akun orang lain
 * hanya dengan mengetahui emailnya dari IP yang berbeda-beda, sekaligus mencegah
 * satu IP mem-brute-force banyak akun berbeda secara paralel.
 */
export function rateLimitByIpAndIdentifier(
  event: H3Event,
  identifier: string,
  routeLabel: string,
  options?: RateLimitOptions
): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
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

/** Reset counter untuk kombinasi IP + identifier yang sama (dipanggil setelah sukses). */
export function resetRateLimitByIpAndIdentifier(event: H3Event, identifier: string, routeLabel: string): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  resetRateLimit(`${routeLabel}:${ip}:${identifier.toLowerCase()}`);
}

/**
 * Rate limit murni berbasis IP (tanpa identifier tambahan) — untuk endpoint yang
 * belum tahu siapa usernya di awal request, mis. reset-password yang cuma punya token acak.
 */
export function rateLimitByIp(event: H3Event, routeLabel: string, options?: RateLimitOptions): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
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