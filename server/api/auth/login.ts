// server/api/auth/login.ts
import { db } from "../../utils/db";
import bcrypt from "bcrypt";

const ALLOWED_ROLES = ["PEMILIK", "KASIR"];

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email dan password wajib diisi!",
    });
  }

  // Satu pesan generik dipakai untuk semua kasus gagal autentikasi,
  // supaya tidak membocorkan apakah email terdaftar, role-nya apa, atau di titik mana gagalnya.
  const invalidCredentials = () =>
    createError({
      statusCode: 401,
      statusMessage: "Email atau kata sandi salah!",
    });

  try {
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      throw invalidCredentials();
    }

    if (!ALLOWED_ROLES.includes(user.role)) {
      throw invalidCredentials();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw invalidCredentials();
    }

    // Baru cek status akun SETELAH kredensial terbukti benar —
    // supaya info "akun nonaktif" nggak bisa dipakai buat nebak email yang valid.
    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        statusMessage: "Akun Anda telah dinonaktifkan. Hubungi pemilik toko.",
      });
    }

    setCookie(event, "user_role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    setCookie(event, "user_email", user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return {
      success: true,
      message: "Login berhasil",
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error: any) {
    // Error yang sengaja kita lempar sendiri (400/401/403) → teruskan apa adanya, pesannya memang untuk user
    if (error.statusCode) {
      throw error;
    }

    // Error tak terduga (DB down, bug, dll) → jangan bocorkan detail teknis ke user,
    // tapi tetap log di server buat kamu debug
    console.error("Login error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Terjadi kesalahan, silakan coba lagi nanti.",
    });
  }
});