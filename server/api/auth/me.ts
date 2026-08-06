// server/api/auth/me.ts
import jwt from "jsonwebtoken";

export default defineEventHandler((event) => {
  // Ambil cookie auth_token yang diset saat login
  const token = getCookie(event, "auth_token");

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Belum login",
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";
    const decoded = jwt.verify(token, jwtSecret);

    return {
      success: true,
      user: decoded,
    };
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: "Sesi telah berakhir atau token tidak valid",
    });
  }
});