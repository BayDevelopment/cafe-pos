// server/api/transactions/[id].delete.ts
import { db } from "../../utils/db";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: "PEMILIK" | "KASIR";
}

export default defineEventHandler(async (event) => {
  // 1. Verifikasi Otentikasi JWT
  let user = event.context.user;

  if (!user) {
    let token = getCookie(event, "auth_token");
    if (!token) {
      const authHeader = getHeader(event, "authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-kedaikopi";
        const payload = jwt.verify(token, jwtSecret) as JwtPayload;
        user = { id: payload.userId, role: payload.role };
        event.context.user = user;
      } catch (e) {
        // Token tidak valid
      }
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Anda harus login untuk menghapus transaksi",
    });
  }

  // 2. Otorisasi: hanya PEMILIK yang boleh menghapus transaksi
  if (user.role?.toUpperCase() !== "PEMILIK") {
    throw createError({
      statusCode: 403,
      statusMessage: "Akses ditolak. Hanya Pemilik yang dapat menghapus transaksi.",
    });
  }

  // 3. Ambil ID Transaksi dari Parameter URL
  const idParam = getRouterParam(event, "id");
  const orderId = Number(idParam);

  if (!orderId || isNaN(orderId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID Transaksi tidak valid",
    });
  }

  try {
    // 4. Pastikan transaksi memang ada sebelum dihapus
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!existingOrder) {
      throw createError({
        statusCode: 404,
        statusMessage: `Transaksi #${String(orderId).padStart(6, "0")} tidak ditemukan`,
      });
    }

    // 5. Hapus OrderItem terkait terlebih dahulu jika tidak set Cascade Delete
    await db.orderItem.deleteMany({
      where: { orderId: orderId },
    });

    // 6. Hapus Order Utama
    await db.order.delete({
      where: { id: orderId },
    });

    return {
      success: true,
      message: `Transaksi #${String(orderId).padStart(6, "0")} berhasil dihapus`,
    };
  } catch (error: any) {
    // Jika error sudah berupa H3Error (mis. dari createError di atas), lempar apa adanya
    if (error?.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Gagal menghapus transaksi: " + error.message,
    });
  }
});