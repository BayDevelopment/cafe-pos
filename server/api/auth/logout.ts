// server/api/auth/logout.ts
import { defineEventHandler, getMethod, deleteCookie, createError } from "h3";

export default defineEventHandler((event) => {
  if (getMethod(event) !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  // Atribut ini sengaja disamakan persis dengan setCookie() di login.ts,
  // supaya penghapusan cookie konsisten di semua browser/kondisi.
  deleteCookie(event, "auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return {
    success: true,
    message: "Logout berhasil",
  };
});