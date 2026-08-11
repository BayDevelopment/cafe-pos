import { db } from "../../utils/db";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId?: string | number;
  id?: string | number;
  role: "PEMILIK" | "KASIR";
  iat?: number;
  exp?: number;
}

export default defineEventHandler(async (event) => {
  let user = event.context.user;

  // 1. Verifikasi otentikasi jika belum diisi middleware
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
        
        user = {
          id: payload.userId ?? payload.id,
          role: payload.role,
        };
        event.context.user = user;
      } catch (e) {
        // Token tidak valid atau kedaluwarsa
      }
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Anda harus login untuk mengakses data transaksi",
    });
  }

  const id = event.context.params?.id;

  // Validasi jika ID tidak ada atau bukan angka
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID pesanan tidak valid",
    });
  }

  const method = event.method;
  const orderId = Number(id);

  try {
    // --- FITUR 1: HANDLE METHOD GET (Melihat Detail Order) ---
    if (method === "GET") {
      const order = await db.order.findUnique({
        where: { id: orderId },
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw createError({
          statusCode: 404,
          statusMessage: "Pesanan tidak ditemukan",
        });
      }

      return {
        success: true,
        data: order,
      };
    }

    // --- FITUR 2: HANDLE METHOD DELETE (Menghapus Order - Khusus PEMILIK) ---
    if (method === "DELETE") {
      // Validasi ketat role: Hanya PEMILIK yang boleh menghapus order
      if (user.role !== "PEMILIK") {
        throw createError({
          statusCode: 403,
          statusMessage: "Akses ditolak. Hanya PEMILIK yang berhak menghapus data transaksi.",
        });
      }

      // Pastikan order yang ingin dihapus benar-benar ada
      const existingOrder = await db.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (!existingOrder) {
        throw createError({
          statusCode: 404,
          statusMessage: "Pesanan yang akan dihapus tidak ditemukan",
        });
      }

      // Lakukan transaksi penghapusan (Opsional: Jika ingin stok dikembalikan saat order dihapus, 
      // Anda bisa menambahkan logika loop pengembalian stok di dalam db.$transaction)
      await db.$transaction(async (tx) => {
        // Hapus relasi order items terlebih dahulu jika database Anda belum CASCADE delete
        await tx.orderItem.deleteMany({
          where: { orderId: orderId },
        });

        // Hapus order utama
        await tx.order.delete({
          where: { id: orderId },
        });
      });

      return {
        success: true,
        message: `Pesanan dengan ID #${orderId} berhasil dihapus oleh Pemilik.`,
      };
    }

    // Jika method selain GET dan DELETE
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Terjadi kesalahan server: " + (error?.message || "Internal Server Error"),
    });
  }
});