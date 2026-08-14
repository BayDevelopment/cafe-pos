// server/api/auth/me.ts
import { defineEventHandler, createError } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  try {
    // 1. Verifikasi user melalui token JWT & pastikan aktif
    const authUser = await requireUser(event);

    // 2. Ambil profil lengkap dari database
    const user = await db.user.findUnique({
      where: { id: authUser.id },
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

    // 3. Tangani edge case jika user terhapus atau nonaktif
    if (!user || !user.isActive) {
      throw createError({ 
        statusCode: 401, 
        message: "Akun tidak ditemukan atau telah dinonaktifkan." 
      });
    }

    // 4. Kembalikan dengan struktur standar yang konsisten (dibungkus dalam .data)
    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  } catch (error: any) {
    console.error("API Error [GET /api/auth/me]:", error);

    const isKnownError = typeof error.statusCode === "number";
    throw createError({
      statusCode: error.statusCode || 500,
      message: isKnownError ? error.message : "Gagal memuat data sesi pengguna.",
    });
  }
});