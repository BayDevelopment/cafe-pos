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
      statusMessage: "Anda harus login untuk melihat data transaksi",
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

  try {
    // 2. Query data order + relasi cashier (User) & products
    const order = await db.order.findUnique({
      where: { id: Number(id) },
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
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pesanan: " + (error?.message || "Internal Server Error"),
    });
  }
});