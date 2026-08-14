import type { H3Event } from "h3";
import { getCookie, getHeader, deleteCookie, createError } from "h3";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { Role } from "../../generated/prisma/enums";

export interface AuthUser {
  id: string; // User.id di schema bertipe String (uuid)
  role: Role;
}

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: string;
}

/**
 * Ambil & verifikasi token dari cookie atau header Authorization.
 * TIDAK PERNAH memakai secret fallback — kalau JWT_SECRET tidak diset,
 * server gagal secara eksplisit (fail closed), bukan diam-diam pakai secret publik.
 */
function verifyToken(event: H3Event): JwtPayload | null {
  let token = getCookie(event, "auth_token") || getCookie(event, "token");

  if (!token) {
    const authHeader = getHeader(event, "authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    // Jangan pernah lanjut tanpa secret asli dari environment.
    throw createError({
      statusCode: 500,
      statusMessage: "Konfigurasi server tidak lengkap (JWT_SECRET belum diset).",
    });
  }

  try {
    // jwt.verify MEMVALIDASI SIGNATURE — bukan sekadar decode payload.
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch {
    // Token invalid / kedaluwarsa / signature tidak cocok — bersihkan cookie basi
    // supaya browser tidak terus-menerus mengirim token yang sudah tidak berguna.
    deleteCookie(event, "auth_token", { path: "/" });
    deleteCookie(event, "token", { path: "/" });
    return null;
  }
}

/**
 * Mengembalikan user yang sudah terautentikasi (id + role), atau null kalau tidak login.
 * Role di-normalisasi ke uppercase dan divalidasi terhadap whitelist yang dikenal.
 */
export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  // Kalau sudah pernah diverifikasi di middleware pada request yang sama, reuse.
  const cached = event.context.user as AuthUser | undefined;
  if (cached?.id && cached?.role) return cached;

  const payload = verifyToken(event);
  if (!payload) return null;

  const rawId = payload.userId ?? payload.id;
  const rawRole = String(payload.role || "").toUpperCase();

  if (!rawId || (rawRole !== Role.PEMILIK && rawRole !== Role.KASIR)) {
    return null;
  }

  // Double-check ke database bahwa user masih ada, aktif, & rolenya konsisten dengan token.
  // Ini mencegah token lama tetap valid setelah role diubah / akun dinonaktifkan di DB.
  const dbUser = await db.user.findUnique({
    where: { id: rawId },
    select: { role: true, isActive: true },
  });

  if (!dbUser || !dbUser.isActive) return null;
  if (dbUser.role !== (rawRole as Role)) return null;

  const user: AuthUser = { id: rawId, role: dbUser.role };
  event.context.user = user;
  return user;
}

/**
 * Untuk dipakai oleh middleware global (server/middleware/auth.global.ts).
 * Mengisi event.context.user kalau ada token valid — TIDAK melempar error kalau
 * tidak ada token sama sekali (request publik/anonim tetap boleh lanjut).
 * Error konfigurasi (JWT_SECRET belum diset) tetap diteruskan, supaya endpoint
 * yang benar-benar butuh login mendapat 500 yang jelas, bukan gagal diam-diam.
 */
export async function identifyUser(event: H3Event): Promise<void> {
  try {
    await getAuthUser(event);
  } catch (err: any) {
    // Kalau errornya karena tidak ada token / token invalid, itu wajar untuk request publik.
    // Kalau errornya karena JWT_SECRET tidak diset (config error), biarkan menjalar —
    // supaya ketahuan dari awal, bukan baru gagal nyasar di endpoint tertentu.
    if (err?.statusCode === 500) throw err;
  }
}

/** Wajib login (role apapun). Melempar 401 kalau tidak ada sesi valid. */
export async function requireUser(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Anda harus login untuk mengakses fitur ini." });
  }
  return user;
}

/** Wajib login DAN berperan sebagai Pemilik. Melempar 401/403 kalau tidak sesuai. */
export async function requireOwner(event: H3Event): Promise<AuthUser> {
  const user = await requireUser(event);
  if (user.role !== Role.PEMILIK) {
    throw createError({ statusCode: 403, statusMessage: "Akses ditolak: Hanya Pemilik Toko yang berhak mengakses fitur ini." });
  }
  return user;
}