// server/api/auth/update-profile.ts
import {
  defineEventHandler,
  getMethod,
  readBody,
  createError,
} from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";
import bcrypt from "bcrypt";

const inFlightUpdates = new Set<string>();

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "PUT") {
    throw createError({ statusCode: 405, message: "Method Not Allowed" });
  }

  // Menggunakan utility auth yang aman & konsisten dengan seluruh sistem
  const authUser = await requireUser(event);
  const userId = authUser.id;

  if (inFlightUpdates.has(userId)) {
    throw createError({ statusCode: 409, message: "Permintaan sedang diproses, mohon tunggu sebentar." });
  }

  inFlightUpdates.add(userId);

  try {
    const sessionUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!sessionUser || !sessionUser.isActive) {
      throw createError({ statusCode: 401, message: "Akun tidak ditemukan atau nonaktif." });
    }

    const body = await readBody(event);
    const { name, email, oldPassword, newPassword } = body;

    // 1. Validasi Nama
    if (!name || name.trim().length === 0) {
      throw createError({ statusCode: 400, message: "Nama lengkap wajib diisi." });
    }

    // 2. Validasi Email
    const cleanEmail = email?.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      throw createError({ statusCode: 400, message: "Format email tidak valid." });
    }

    // 3. Cek Proteksi Email
    const emailChanged = cleanEmail !== sessionUser.email;
    const isOwner = sessionUser.role === "PEMILIK";
    const isVerified = !!sessionUser.emailVerifiedAt;

    if (emailChanged && isVerified && !isOwner) {
      throw createError({ statusCode: 403, message: "Email sudah terverifikasi dan tidak dapat diubah kecuali oleh Pemilik." });
    }

    // 4. Persiapan Data Update
    const updateData: Record<string, any> = { name: name.trim(), email: cleanEmail };

    if (emailChanged) {
      updateData.emailVerifiedAt = null;
    }

    // 5. Logika Ganti Password
    if (newPassword) {
      if (!oldPassword) {
        throw createError({ statusCode: 400, message: "Password lama wajib diisi untuk mengganti password." });
      }
      
      const isOldPasswordValid = await bcrypt.compare(oldPassword, sessionUser.password);
      if (!isOldPasswordValid) {
        throw createError({ statusCode: 400, message: "Password lama salah." });
      }

      if (newPassword.length < 6) {
        throw createError({ statusCode: 400, message: "Password baru minimal 6 karakter." });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    // 6. Eksekusi Update ke Database
    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, 
        isActive: true, createdAt: true, emailVerifiedAt: true,
      },
    });

    return { success: true, data: updatedUser };

  } catch (error: any) {
    if (error.code === "P2002") {
      throw createError({ statusCode: 400, message: "Email sudah digunakan oleh akun lain." });
    }
    
    if (error.statusCode) {
      throw error;
    }

    console.error("API Update Profile Error:", error);
    throw createError({ statusCode: 500, message: "Terjadi kesalahan server." });
  } finally {
    if (userId) {
      inFlightUpdates.delete(userId);
    }
  }
});