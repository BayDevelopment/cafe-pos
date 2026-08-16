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

  rateLimitByIp(event, "reset-password", { maxAttempts: 5, windowMs: 60 * 1000 });

  let body: any;
  try {
    body = await readBody(event);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Body request tidak valid." });
  }

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
        // passwordChangedAt di-set supaya token JWT lama (kalau sempat
        // dicuri sebelum reset dilakukan) langsung tidak berlaku lagi.
        data: { password: hashedNewPassword, passwordChangedAt: new Date() },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      db.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null, id: { not: resetToken.id } },
      }),
    ]);

    // role dikembalikan supaya frontend tahu redirect ke halaman login yang
    // benar (/owner/login vs /kasir/login) — bukan data sensitif, cuma label akses.
    return {
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
      role: resetToken.user.role,
    };
  } catch (error: any) {
    if (error?.statusCode) throw error;
    console.error("Reset password error:", error);
    throw createError({ statusCode: 500, statusMessage: "Terjadi kesalahan, silakan coba lagi nanti." });
  }
});