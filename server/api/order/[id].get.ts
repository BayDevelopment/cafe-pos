// server/api/order/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";
import { Role } from "../../../generated/prisma/enums";

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const isOwner = authUser.role === Role.PEMILIK;

  const idParam = getRouterParam(event, "id");
  const orderId = Number(idParam);
  if (!idParam || !Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "ID pesanan tidak valid" });
  }

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        cashier: { select: { id: true, name: true, email: true, role: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, price: true } } },
        },
      },
    });

    if (!order) {
      throw createError({ statusCode: 404, statusMessage: "Pesanan tidak ditemukan" });
    }

    // Kasir hanya boleh melihat order miliknya sendiri — mencegah enumerasi ID
    // (1, 2, 3, ...) untuk mengintip transaksi kasir lain. Pemilik bebas melihat semua.
    if (!isOwner && order.cashierId !== String(authUser.id)) {
      throw createError({ statusCode: 403, statusMessage: "Anda tidak berhak melihat pesanan ini." });
    }

    // Email kasir hanya relevan untuk Pemilik; kasir yang melihat order miliknya sendiri
    // otomatis melihat emailnya sendiri, jadi tidak perlu disembunyikan dari kasus itu.
    const responseOrder = isOwner
      ? order
      : { ...order, cashier: order.cashier ? { id: order.cashier.id, name: order.cashier.name, role: order.cashier.role } : null };

    return { success: true, data: responseOrder };
  } catch (error: any) {
    if (error?.statusCode) throw error;

    console.error("Gagal mengambil detail pesanan:", error);
    throw createError({ statusCode: 500, statusMessage: "Terjadi kesalahan server." });
  }
});