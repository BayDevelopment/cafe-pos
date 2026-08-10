// server/api/auth/me.ts
import jwt from "jsonwebtoken";
import { db } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Belum login",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; role: string };

    // Ambil data user terbaru dari database, bukan cuma dari isi token
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
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
        statusMessage: "Akun tidak ditemukan atau telah dinonaktifkan",
      });
    }

    // Kembalikan langsung sebagai object user (tanpa dibungkus { success, user })
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;

    throw createError({
      statusCode: 401,
      statusMessage: "Sesi telah berakhir atau token tidak valid",
    });
  }
});