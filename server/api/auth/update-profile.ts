// server/api/auth/update-profile.ts
import { db } from "../../utils/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

interface JwtPayload {
  userId: string;
  [key: string]: any;
}

const inFlightUpdates = new Set<string>();

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "PUT") {
    throw createError({
      statusCode: 405,
      message: "Method Not Allowed",
    });
  }

  try {
    // 1. Ambil & verifikasi JWT dari cookie
    const token = getCookie(event, "auth_token");

    if (!token) {
      throw createError({
        statusCode: 401,
        message: "Autentikasi gagal: Silakan login terlebih dahulu.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";
    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (err) {
      throw createError({
        statusCode: 401,
        message: "Sesi tidak valid atau sudah kedaluwarsa. Silakan login ulang.",
      });
    }

    // 2. Proteksi Double-Submit / Race Condition (In-memory lock)
    if (inFlightUpdates.has(payload.userId)) {
      throw createError({
        statusCode: 409,
        message: "Permintaan sebelumnya masih diproses, mohon tunggu sebentar.",
      });
    }
    inFlightUpdates.add(payload.userId);

    try {
      // 3. Ambil data user terbaru dari Database
      const sessionUser = await db.user.findUnique({
        where: { id: payload.userId },
      });

      if (!sessionUser || !sessionUser.isActive) {
        throw createError({
          statusCode: 401,
          message: "Sesi tidak valid atau akun dinonaktifkan.",
        });
      }

      // 4. Ambil & Sanitasi Payload dari Body Request
      const body = await readBody(event);
      const rawName = body?.name;
      const rawEmail = body?.email;
      const oldPassword = body?.oldPassword;
      const newPassword = body?.newPassword;

      // --- VALIDASI KETAT NAMA ---
      if (!rawName || typeof rawName !== "string") {
        throw createError({
          statusCode: 400,
          message: "Nama lengkap wajib diisi dengan format yang benar.",
        });
      }
      const name = rawName.trim();
      if (name.length === 0 || name.length > 255) {
        throw createError({
          statusCode: 400,
          message: "Nama lengkap harus di antara 1 hingga 255 karakter.",
        });
      }

      // --- VALIDASI KETAT EMAIL ---
      if (!rawEmail || typeof rawEmail !== "string") {
        throw createError({
          statusCode: 400,
          message: "Alamat email wajib diisi.",
        });
      }
      const email = rawEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 255) {
        throw createError({
          statusCode: 400,
          message: "Format alamat email tidak valid atau terlalu panjang.",
        });
      }

      // 5. Validasi Aturan Perubahan Email & Proteksi Role
      const emailChanged = email !== sessionUser.email;
      const isOwner = sessionUser.role === "PEMILIK";
      const isVerified = !!sessionUser.emailVerifiedAt;

      if (emailChanged && isVerified && !isOwner) {
        throw createError({
          statusCode: 403,
          message: "Email sudah terverifikasi dan terkunci. Anda tidak diizinkan mengubahnya.",
        });
      }

      // 6. Siapkan Objek Update Data Dasar
      const updateData: Record<string, any> = {
        name,
        email,
      };

      if (emailChanged) {
        // Reset verifikasi otomatis jika email diganti oleh pemilik
        updateData.emailVerifiedAt = null;
      }

      // 7. Validasi Ketat Proses Ganti Password (Opsional)
      if (newPassword !== undefined && newPassword !== null && newPassword !== "") {
        if (typeof newPassword !== "string") {
          throw createError({
            statusCode: 400,
            message: "Format kata sandi baru tidak valid.",
          });
        }

        if (!oldPassword || typeof oldPassword !== "string") {
          throw createError({
            statusCode: 400,
            message: "Kata sandi lama wajib diisi untuk melakukan perubahan kata sandi.",
          });
        }

        if (newPassword.length < 6) {
          throw createError({
            statusCode: 400,
            message: "Kata sandi baru minimal harus terdiri dari 6 karakter.",
          });
        }

        // Verifikasi kesesuaian password lama dengan hash di DB
        const isOldPasswordValid = await bcrypt.compare(oldPassword, sessionUser.password);
        if (!isOldPasswordValid) {
          throw createError({
            statusCode: 400,
            message: "Kata sandi lama yang Anda masukkan salah.",
          });
        }

        // Pastikan password baru tidak sama persis dengan password lama
        const isSameAsOld = await bcrypt.compare(newPassword, sessionUser.password);
        if (isSameAsOld) {
          throw createError({
            statusCode: 400,
            message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
          });
        }

        // Hash password baru dengan salt rounds yang aman (12)
        const SALT_ROUNDS = 12;
        updateData.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
      }

      // 8. Eksekusi Update ke Database & Tangani Unique Constraint Error
      let updatedUser;
      try {
        updatedUser = await db.user.update({
          where: { id: sessionUser.id },
          data: updateData,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            emailVerifiedAt: true,
          },
        });
      } catch (dbErr: any) {
        // Kode Prisma untuk pelanggaran unique constraint (email sudah terdaftar)
        if (dbErr.code === "P2002") {
          throw createError({
            statusCode: 400,
            message: "Alamat email tersebut sudah digunakan oleh akun lain.",
          });
        }
        throw dbErr;
      }

      return {
        success: true,
        message: "Profil pengguna berhasil diperbarui.",
        data: updatedUser,
      };

    } finally {
      // Pastikan lock memori selalu dilepas setelah proses selesai/gagal
      inFlightUpdates.delete(payload.userId);
    }

  } catch (error: any) {
    console.error("API Error [PUT /api/auth/update-profile]:", error);

    const isKnownError = typeof error.statusCode === "number";
    throw createError({
      statusCode: error.statusCode || 500,
      message: isKnownError
        ? error.message
        : "Terjadi kesalahan internal pada server.",
    });
  }
});