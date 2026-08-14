// server/api/auth/forgot-password.post.ts
import { defineEventHandler, getMethod, readBody, createError } from "h3";
import crypto from "node:crypto";
import { db } from "../../utils/db";
import { rateLimitByIpAndIdentifier } from "../../utils/rateLimiter";
import { sendEmail } from "../../utils/mailer";

const MAX_EMAIL_LEN = 255;
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 menit

// Pesan ini SENGAJA sama persis untuk semua kondisi (email ada/tidak ada,
// akun aktif/nonaktif) — supaya tidak membocorkan email mana yang terdaftar.
const GENERIC_RESPONSE_MESSAGE = "Jika email tersebut terdaftar, kami telah mengirimkan link untuk mengatur ulang password.";

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// Kirim email reset password lewat SMTP (Nodemailer). Kalau gagal kirim, error
// dilempar ke pemanggil — endpoint utama sengaja menyembunyikan kegagalan ini
// dari response client (tetap balas pesan generik), tapi tetap di-log di server.
async function sendResetPasswordEmail(email: string, rawToken: string) {
  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color:#2b1b12;">Reset Password</h2>
      <p>Kami menerima permintaan untuk mengatur ulang password akun kamu.</p>
      <p>
        <a href="${resetUrl}"
           style="display:inline-block; background:#2b1b12; color:#faf6ee; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
          Atur Ulang Password
        </a>
      </p>
      <p style="color:#8A7A68; font-size:13px;">
        Link ini berlaku selama 30 menit. Kalau kamu tidak merasa meminta reset password,
        abaikan saja email ini — password kamu tidak akan berubah.
      </p>
    </div>
  `;

  await sendEmail(email, "Reset Password - Kedai Kopi POS", html);
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = await readBody(event);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > MAX_EMAIL_LEN) {
    throw createError({ statusCode: 400, statusMessage: "Email tidak valid." });
  }

  // Rate limit: maksimal 5 permintaan reset per menit, per kombinasi IP + email.
  // Mencegah spam email ke satu alamat & mencegah scraping massal banyak email dari 1 IP.
  rateLimitByIpAndIdentifier(event, email, "forgot-password", { maxAttempts: 5, windowMs: 60 * 1000 });

  try {
    const user = await db.user.findUnique({ where: { email } });

    // Kalau user tidak ada / nonaktif, tetap balas sukses generik (jangan bocorkan info),
    // cukup jangan kirim email apapun.
    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = hashToken(rawToken);

      await db.$transaction([
        // Batalkan token lama yang belum dipakai, supaya cuma ada 1 token aktif per user.
        db.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null },
        }),
        db.passwordResetToken.create({
          data: {
            token: hashedToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
          },
        }),
      ]);

      await sendResetPasswordEmail(user.email, rawToken);
    }

    return { success: true, message: GENERIC_RESPONSE_MESSAGE };
  } catch (error: any) {
    if (error?.statusCode) throw error;

    console.error("Forgot password error:", error);
    // Tetap balas pesan generik yang sama walau ada error internal — jangan bocorkan detail.
    return { success: true, message: GENERIC_RESPONSE_MESSAGE };
  }
});