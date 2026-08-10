// server/api/auth/update-profile.ts
import { db } from "../../utils/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Sesuaikan dengan payload JWT yang kamu buat saat login
interface JwtPayload {
  userId: string;
  [key: string]: any;
}

// Lock in-memory sederhana: cegah 1 user mengirim >1 request update-profile
// yang diproses BERSAMAAN (mis. double-klik yang lolos dari :disabled di frontend,
// atau request diulang manual lewat curl/Postman).
// CATATAN PENTING: Set ini hidup di memori 1 proses Node saja. Kalau nanti
// deploy multi-instance/serverless (banyak replika berjalan paralel), lock ini
// TIDAK efektif lintas instance — perlu diganti mekanisme lock terpusat
// seperti Redis (SETNX/SET...NX) kalau butuh proteksi lintas instance.
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

    // Tolak kalau user ini masih punya request update-profile lain yang
    // sedang diproses (belum selesai) — mencegah double-submit diproses ganda.
    if (inFlightUpdates.has(payload.userId)) {
      throw createError({
        statusCode: 409,
        message: "Permintaan sebelumnya masih diproses, mohon tunggu sebentar.",
      });
    }
    inFlightUpdates.add(payload.userId);

    try {

    // 2. Ambil user dari DB berdasarkan userId di dalam JWT
    //    (tetap perlu query DB sekali di sini karena kita butuh password hash,
    //     role, dan status isActive/emailVerifiedAt terbaru — bukan untuk
    //     memvalidasi sesi, tapi untuk memuat data user yang akan diupdate)
    const sessionUser = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!sessionUser || !sessionUser.isActive) {
      throw createError({
        statusCode: 401,
        message: "Sesi tidak valid atau akun dinonaktifkan.",
      });
    }

    // 3. Ambil & validasi payload dari frontend
    const body = await readBody(event);
    const { name, email, oldPassword, newPassword } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw createError({
        statusCode: 400,
        message: "Nama wajib diisi.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        message: "Format email tidak valid.",
      });
    }

    // 4. Tegakkan aturan "email terkunci" di server (bukan cuma di UI)
    //    Sama seperti logic isEmailDisabled di frontend:
    //    email tidak boleh diubah jika sudah terverifikasi DAN role bukan PEMILIK
    const emailChanged = email !== sessionUser.email;
    const isOwner = sessionUser.role === "PEMILIK";
    const isVerified = !!sessionUser.emailVerifiedAt;

    if (emailChanged && isVerified && !isOwner) {
      throw createError({
        statusCode: 403,
        message:
          "Email sudah terverifikasi dan tidak dapat diubah untuk peran ini.",
      });
    }

    // 5. Siapkan data update dasar
    const updateData: Record<string, any> = {
      name: name.trim(),
      email,
    };

    if (emailChanged) {
      // Reset verifikasi jika email berubah
      updateData.emailVerifiedAt = null;
    }

    // 6. Proses ganti password (opsional) — wajib password lama + hashing
    if (newPassword) {
      if (!oldPassword) {
        throw createError({
          statusCode: 400,
          message: "Password lama wajib diisi untuk mengganti password.",
        });
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        throw createError({
          statusCode: 400,
          message: "Password baru minimal harus 6 karakter.",
        });
      }

      const isOldPasswordValid = await bcrypt.compare(
        oldPassword,
        sessionUser.password
      );

      if (!isOldPasswordValid) {
        throw createError({
          statusCode: 400,
          message: "Password lama yang kamu masukkan salah.",
        });
      }

      const isSameAsOld = await bcrypt.compare(
        newPassword,
        sessionUser.password
      );
      if (isSameAsOld) {
        throw createError({
          statusCode: 400,
          message: "Password baru tidak boleh sama dengan password lama.",
        });
      }

      const SALT_ROUNDS = 12;
      updateData.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    // 7. Update ke database — tangani konflik email unik dari Prisma langsung
    //    (menghindari race condition dari cek findUnique + update terpisah)
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
    } catch (err: any) {
      // Kode error unique constraint Prisma
      if (err.code === "P2002") {
        throw createError({
          statusCode: 400,
          message: "Alamat email sudah digunakan oleh akun lain.",
        });
      }
      throw err;
    }

    return {
      success: true,
      message: "Profil berhasil diperbarui.",
      data: updatedUser,
    };
    } finally {
      // Selalu lepas lock, baik sukses maupun gagal, supaya user ini
      // bisa mengirim update-profile lagi setelah request ini selesai.
      inFlightUpdates.delete(payload.userId);
    }
  } catch (error: any) {
    console.error("API Error /api/auth/update-profile:", error);

    // Jangan bocorkan detail error internal untuk error yang tidak dikenal
    const isKnownError = typeof error.statusCode === "number";

    throw createError({
      statusCode: error.statusCode || 500,
      message: isKnownError
        ? error.message
        : "Terjadi kesalahan pada server saat memperbarui profil.",
    });
  }
});