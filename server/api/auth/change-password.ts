// server/api/auth/change-password.ts
import { db } from "../../utils/db";
import bcrypt from "bcrypt";

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  // event.context.user di-attach oleh server/middleware/auth.ts
  const currentUser = event.context.user;
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: "Belum login",
    });
  }

  const body = await readBody(event);
  const { oldPassword, newPassword, confirmPassword } = body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Semua field wajib diisi!",
    });
  }

  if (newPassword !== confirmPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Konfirmasi password baru tidak cocok!",
    });
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password baru minimal 8 karakter!",
    });
  }

  if (newPassword === oldPassword) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password baru tidak boleh sama dengan password lama!",
    });
  }

  try {
    // Ambil ulang data user dari DB (jangan percaya penuh event.context.user,
    // karena isinya cuma payload JWT — belum tentu masih sinkron dengan data terbaru di DB,
    // misal kalau akun barusan dinonaktifkan pemilik tapi token lama masih dipakai)
    const user = await db.user.findUnique({ where: { id: currentUser.id } });

    if (!user || !user.isActive) {
      throw createError({
        statusCode: 401,
        statusMessage: "Sesi tidak valid, silakan login ulang.",
      });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: "Password lama salah!",
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return {
      success: true,
      message: "Password berhasil diubah",
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("Change password error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Terjadi kesalahan, silakan coba lagi nanti.",
    });
  }
});