import { db } from "../../utils/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const DUMMY_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8p9pQXbYCJH3nY3ceOCKtapNe0Zpuu";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      message: "Method not allowed",
      statusMessage: "Method not allowed",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const { email, password } = body || {};

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: "Email dan password wajib diisi!",
      statusMessage: "Email dan password wajib diisi!",
    });
  }

  try {
    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    const isPasswordValid = await bcrypt.compare(
      String(password),
      user?.password ?? DUMMY_HASH
    );

    if (!user || !isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: "Email atau kata sandi salah!",
        statusMessage: "Email atau kata sandi salah!",
      });
    }

    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        message: "Akun Anda telah dinonaktifkan. Hubungi pemilik toko.",
        statusMessage: "Akun Anda telah dinonaktifkan. Hubungi pemilik toko.",
      });
    }

    // Menggunakan fallback jika JWT_SECRET di .env belum diset agar tidak crash HTTP 500
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    setCookie(event, "auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return {
      success: true,
      message: "Login berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    // Jika error buatan kita sendiri (400, 401, 403), teruskan
    if (error.statusCode) {
      throw error;
    }

    // Jika error tak terduga (misal DB mati / Prisma error)
    console.error("CRITICAL LOGIN ERROR:", error);
    throw createError({
      statusCode: 500,
      message: "Terjadi kesalahan server: " + (error?.message || "Internal Server Error"),
      statusMessage: "Terjadi kesalahan server.",
    });
  }
});