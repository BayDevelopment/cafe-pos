// server/api/auth/me.ts
import { defineEventHandler, createError } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  try {
    const authUser = await requireUser(event);

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

    if (!user || !user.isActive) {
      throw createError({
        statusCode: 401,
        message: "Akun tidak ditemukan atau telah dinonaktifkan.",
      });
    }

    // Langsung kembalikan objek user agar terbaca langsung di frontend (user.name)
    return user;

  } catch (error: any) {
    console.error("API Error [GET /api/auth/me]:", error);

    const isKnownError = typeof error.statusCode === "number";
    throw createError({
      statusCode: error.statusCode || 500,
      message: isKnownError
        ? error.message
        : "Gagal memuat data sesi pengguna.",
    });
  }
});