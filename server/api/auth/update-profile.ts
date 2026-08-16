// server/api/auth/update-profile.ts
import { defineEventHandler, getMethod, readBody, createError, setCookie } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";
import { checkRateLimit, resetRateLimit } from "../../utils/rateLimiter";
import bcrypt from "bcrypt";

const MAX_NAME_LEN = 100;
const MAX_EMAIL_LEN = 255;
const MIN_PASSWORD_LEN = 8;
const MAX_PASSWORD_LEN = 200;

const inFlightUpdates = new Set<string>();

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== "PUT") {
    throw createError({ statusCode: 405, message: "Method Not Allowed" });
  }

  const authUser = await requireUser(event);
  const userId = authUser.id;

  if (inFlightUpdates.has(userId)) {
    throw createError({ statusCode: 409, message: "Permintaan sedang diproses, mohon tunggu sebentar." });
  }
  inFlightUpdates.add(userId);

  try {
    const sessionUser = await db.user.findUnique({ where: { id: userId } });
    if (!sessionUser || !sessionUser.isActive) {
      throw createError({ statusCode: 401, message: "Akun tidak ditemukan atau nonaktif." });
    }

    let body: any;
    try {
      body = await readBody(event);
    } catch {
      throw createError({ statusCode: 400, message: "Body request tidak valid." });
    }
    const { name, email, oldPassword, newPassword } = body || {};

    // 1. Validasi Nama
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      throw createError({ statusCode: 400, message: "Nama lengkap wajib diisi." });
    }
    if (name.trim().length > MAX_NAME_LEN) {
      throw createError({ statusCode: 400, message: `Nama tidak boleh melebihi ${MAX_NAME_LEN} karakter.` });
    }

    // 2. Validasi Email
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || cleanEmail.length > MAX_EMAIL_LEN || !emailRegex.test(cleanEmail)) {
      throw createError({ statusCode: 400, message: "Format email tidak valid." });
    }

    // 3. Proteksi Email
    const emailChanged = cleanEmail !== sessionUser.email;
    const isOwner = sessionUser.role === "PEMILIK";
    const isVerified = !!sessionUser.emailVerifiedAt;
    if (emailChanged && isVerified && !isOwner) {
      throw createError({ statusCode: 403, message: "Email sudah terverifikasi dan tidak dapat diubah kecuali oleh Pemilik." });
    }

    const updateData: Record<string, any> = { name: name.trim(), email: cleanEmail };
    if (emailChanged) updateData.emailVerifiedAt = null;

    // 4. Ganti Password (opsional) — pakai rate limit per-user, TERPISAH dari
    // rate limit change-password.ts (route label beda), supaya brute-force
    // oldPassword lewat endpoint manapun tetap kena batas percobaan.
    let passwordChanged = false;
    if (newPassword) {
      const rateLimitKey = `update-profile-password:${userId}`;
      checkRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 60 * 1000 });

      if (!oldPassword) {
        throw createError({ statusCode: 400, message: "Password lama wajib diisi untuk mengganti password." });
      }
      const isOldPasswordValid = await bcrypt.compare(String(oldPassword), sessionUser.password);
      if (!isOldPasswordValid) {
        throw createError({ statusCode: 400, message: "Password lama salah." });
      }
      if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LEN) {
        throw createError({ statusCode: 400, message: `Password baru minimal ${MIN_PASSWORD_LEN} karakter.` });
      }
      if (newPassword.length > MAX_PASSWORD_LEN) {
        throw createError({ statusCode: 400, message: `Password baru tidak boleh melebihi ${MAX_PASSWORD_LEN} karakter.` });
      }
      if (newPassword === oldPassword) {
        throw createError({ statusCode: 400, message: "Password baru tidak boleh sama dengan password lama." });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
      updateData.passwordChangedAt = new Date();
      passwordChanged = true;
      resetRateLimit(rateLimitKey);
    }

    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, createdAt: true, emailVerifiedAt: true,
      },
    });

    // Kalau password diganti, hapus cookie sesi SAAT INI juga —
    // konsisten dengan change-password.ts: user wajib login ulang,
    // dan token lama (device lain) otomatis invalid via passwordChangedAt.
    if (passwordChanged) {
      setCookie(event, "auth_token", "", { maxAge: 0, path: "/" });
    }

    return { success: true, data: updatedUser, passwordChanged };

  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({ statusCode: 400, message: "Email sudah digunakan oleh akun lain." });
    }
    if (error.statusCode) throw error;

    console.error("API Update Profile Error:", error);
    throw createError({ statusCode: 500, message: "Terjadi kesalahan server." });
  } finally {
    inFlightUpdates.delete(userId);
  }
});