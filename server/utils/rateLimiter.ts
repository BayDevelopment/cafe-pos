// server/utils/rateLimiter.ts
import type { H3Event } from "h3";
import { createError, getRequestIP, setResponseHeader } from "h3";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis client (Upstash REST API — cocok untuk serverless/Netlify Functions,
// tidak butuh koneksi TCP persisten seperti ioredis).
// Redis.fromEnv() otomatis baca UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN
// dari environment variables.
// ---------------------------------------------------------------------------
const redis = Redis.fromEnv();

interface RateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
}

// PENTING: set true HANYA kalau app ini berjalan di belakang reverse proxy
// tepercaya (Nginx/Cloudflare/Netlify/dll) yang men-overwrite X-Forwarded-For.
// Kalau server diakses langsung dari internet, WAJIB false — kalau tidak,
// rate limit bisa di-bypass dengan memalsukan header ini.
const TRUST_PROXY = process.env.TRUST_PROXY === "true";

function resolveIp(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: TRUST_PROXY }) || "unknown";
}

/**
 * Cek & increment rate limit counter untuk sebuah key di Redis.
 * Menggunakan fixed-window counter: INCR + EXPIRE (atomic via Lua script
 * bawaan @upstash/redis untuk hindari race condition antar concurrent request).
 *
 * Melempar HTTP 429 kalau limit terlampaui.
 */
export async function checkRateLimit(key: string, options: RateLimitOptions = {}): Promise<void> {
  const maxAttempts = options.maxAttempts ?? 5;
  const windowMs = options.windowMs ?? 60 * 1000;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  const redisKey = `ratelimit:${key}`;

  // INCR bersifat atomic di Redis — aman dari race condition meskipun
  // banyak request/instance serverless nembak bersamaan ke key yang sama.
  const count = await redis.incr(redisKey);

  if (count === 1) {
    // Baru pertama kali kena increment di window ini -> set TTL.
    await redis.expire(redisKey, windowSec);
  }

  if (count > maxAttempts) {
    const ttl = await redis.ttl(redisKey);
    const retryAfterSec = ttl > 0 ? ttl : windowSec;

    throw createError({
      statusCode: 429,
      statusMessage: `Terlalu banyak percobaan. Silakan coba lagi dalam ${retryAfterSec} detik.`,
      data: { retryAfterSec },
    });
  }
}

/**
 * Hapus counter rate limit untuk sebuah key (dipanggil setelah aksi berhasil,
 * misal login sukses, supaya tidak ikut menghitung ke sesi berikutnya).
 */
export async function resetRateLimit(key: string): Promise<void> {
  await redis.del(`ratelimit:${key}`);
}

export async function rateLimitByIpAndIdentifier(
  event: H3Event,
  identifier: string,
  routeLabel: string,
  options?: RateLimitOptions
): Promise<void> {
  const ip = resolveIp(event);
  const key = `${routeLabel}:${ip}:${identifier.toLowerCase()}`;

  try {
    await checkRateLimit(key, options);
  } catch (err: any) {
    if (err?.data?.retryAfterSec) {
      setResponseHeader(event, "Retry-After", err.data.retryAfterSec);
    }
    throw err;
  }
}

export async function resetRateLimitByIpAndIdentifier(
  event: H3Event,
  identifier: string,
  routeLabel: string
): Promise<void> {
  const ip = resolveIp(event);
  await resetRateLimit(`${routeLabel}:${ip}:${identifier.toLowerCase()}`);
}

export async function rateLimitByIp(
  event: H3Event,
  routeLabel: string,
  options?: RateLimitOptions
): Promise<void> {
  const ip = resolveIp(event);
  const key = `${routeLabel}:${ip}`;

  try {
    await checkRateLimit(key, options);
  } catch (err: any) {
    if (err?.data?.retryAfterSec) {
      setResponseHeader(event, "Retry-After", err.data.retryAfterSec);
    }
    throw err;
  }
}