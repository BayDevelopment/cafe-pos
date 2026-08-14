// server/api/auth/change-password.ts
import { defineEventHandler, getMethod, readBody, createError } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";
import { rateLimitByIpAndIdentifier, resetRateLimitByIpAndIdentifier } from "../../utils/rateLimiter";
import bcrypt from "bcrypt";

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 200;

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // requireUser: verifikasi JWT + cek isActive + cross-check role ke DB (satu jalur terpusat).
  const authUser = await requireUser(event);

  // Rate limit: maksimal 5 percobaan ganti password per menit, per user (bukan per email,
  // karena di titik ini user sudah pasti login). Mencegah brute-force menebak password lama.
  rateLimitByIpAndIdentifier(event, String(authUser.id), "change-password", { maxAttempts: 5, windowMs: 60 * 1000 });

  const body = await readBody(event);
  const { oldPassword, newPassword, confirmPassword } = body || {};

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: "Semua field wajib diisi!" });
  }

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Password baru minimal ${MIN_PASSWORD_LEN} karakter!` });
  }
  if (newPassword.length > MAX_PASSWORD_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Password baru tidak boleh melebihi ${MAX_PASSWORD_LEN} karakter.` });
  }
  if (newPassword !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: "Konfirmasi password baru tidak cocok!" });
  }
  if (newPassword === oldPassword) {
    throw createError({ statusCode: 400, statusMessage: "Password baru tidak boleh sama dengan password lama!" });
  }

  try {
    // Ambil ulang data user dari DB untuk dapat hash password saat ini
    // (requireUser() cuma mengembalikan { id, role }, bukan field password).
    const user = await db.user.findUnique({ where: { id: authUser.id } });

    if (!user || !user.isActive) {
      throw createError({ statusCode: 401, statusMessage: "Sesi tidak valid, silakan login ulang." });
    }

    const isOldPasswordValid = await bcrypt.compare(String(oldPassword), user.password);
    if (!isOldPasswordValid) {
      throw createError({ statusCode: 401, statusMessage: "Password lama salah!" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    // Berhasil — bersihkan counter rate limit untuk user ini.
    resetRateLimitByIpAndIdentifier(event, String(authUser.id), "change-password");

    return {
      success: true,
      message: "Password berhasil diubah",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("Change password error:", error);
    throw createError({ statusCode: 500, statusMessage: "Terjadi kesalahan, silakan coba lagi nanti." });
  }
});