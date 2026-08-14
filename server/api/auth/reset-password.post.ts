// server/api/auth/reset-password.post.ts
import { defineEventHandler, getMethod, readBody, createError } from "h3";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { db } from "../../utils/db";
import { rateLimitByIp } from "../../utils/rateLimiter";

const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 200;

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // Rate limit murni per IP (token acak berentropi tinggi, tapi tetap dibatasi
  // sebagai lapisan pertahanan tambahan terhadap automasi/spam request).
  rateLimitByIp(event, "reset-password", { maxAttempts: 5, windowMs: 60 * 1000 });

  const body = await readBody(event);
  const rawToken = typeof body?.token === "string" ? body.token.trim() : "";
  const { newPassword, confirmPassword } = body || {};

  if (!rawToken) {
    throw createError({ statusCode: 400, statusMessage: "Token reset tidak valid." });
  }
  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Password baru minimal ${MIN_PASSWORD_LEN} karakter.` });
  }
  if (newPassword.length > MAX_PASSWORD_LEN) {
    throw createError({ statusCode: 400, statusMessage: `Password baru tidak boleh melebihi ${MAX_PASSWORD_LEN} karakter.` });
  }
  if (newPassword !== confirmPassword) {
    throw createError({ statusCode: 400, statusMessage: "Konfirmasi password tidak cocok." });
  }

  // Pesan generik untuk semua kondisi token invalid — tidak perlu bedakan
  // "token tidak ada" vs "sudah dipakai" vs "kedaluwarsa" ke client.
  const GENERIC_TOKEN_ERROR = "Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.";

  try {
    const hashedToken = hashToken(rawToken);

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt !== null ||
      resetToken.expiresAt.getTime() < Date.now() ||
      !resetToken.user.isActive
    ) {
      throw createError({ statusCode: 400, statusMessage: GENERIC_TOKEN_ERROR });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedNewPassword },
      }),
      // Tandai token ini sudah dipakai (sekali pakai).
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Batalkan juga token reset lain yang masih aktif untuk user ini (jaga-jaga
      // ada beberapa permintaan reset sebelumnya yang belum dipakai).
      db.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
      }),
    ]);

    return { success: true, message: "Password berhasil direset. Silakan login dengan password baru." };
  } catch (error: any) {
    if (error?.statusCode) throw error;

    console.error("Reset password error:", error);
    throw createError({ statusCode: 500, statusMessage: "Terjadi kesalahan, silakan coba lagi nanti." });
  }
});