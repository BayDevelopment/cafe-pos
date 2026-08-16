// server/api/auth/logout.ts
import { defineEventHandler, getMethod, deleteCookie, createError } from "h3";

export default defineEventHandler((event) => {
  if (getMethod(event) !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  // Hapus kedua kemungkinan nama cookie auth, supaya tidak ada sesi
  // "nyangkut" dari kode lama / jalur lain yang pernah set cookie "token".
  deleteCookie(event, "auth_token", cookieOptions);
  deleteCookie(event, "token", cookieOptions);

  return {
    success: true,
    message: "Logout berhasil",
  };
});