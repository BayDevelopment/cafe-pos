// server/api/transactions/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { Prisma } from "../../../generated/prisma/client";

import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";

const MAX_LIMIT = 100;

// Konversi string 'YYYY-MM-DD' (dianggap tanggal kalender WIB / UTC+7)
// menjadi rentang Date UTC yang benar, supaya tidak salah timezone
// terlepas dari timezone server tempat Node berjalan.
function wibDayStartUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000+07:00`);
}
function wibDayEndUtc(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

function todayWibDateString(): string {
  // Ambil tanggal "hari ini" versi WIB, dihitung dari waktu UTC server + 7 jam
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split("T")[0];
}

export default defineEventHandler(async (event) => {
  const authUser = await requireUser(event);
  const role = String(authUser.role || "").toUpperCase();
  const isOwner = role === "PEMILIK";

  const query = getQuery(event);

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 20));
  const search = query.search ? String(query.search).trim() : "";
  // Value asli: PENDING | PAID | CANCELLED | REFUNDED
  const status = query.status ? String(query.status).trim().toUpperCase() : "";
  const paymentMethod = query.paymentMethod ? String(query.paymentMethod).trim().toUpperCase() : "";

  let startDate = query.startDate ? String(query.startDate) : "";
  let endDate = query.endDate ? String(query.endDate) : "";

  // PENTING: kasir dipaksa hanya boleh lihat transaksi HARI INI (WIB),
  // apapun yang dikirim dari frontend. Ini enforcement di backend,
  // jangan cuma andalkan filter di frontend.
  if (!isOwner) {
    const today = todayWibDateString();
    startDate = today;
    endDate = today;
  }

  const where: Prisma.OrderWhereInput = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = wibDayStartUtc(startDate);
    if (endDate) where.createdAt.lte = wibDayEndUtc(endDate);
  }

  if (status) {
    where.status = status as any;
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod as any;
  }

  if (search) {
    const searchAsId = Number(search);
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { cashier: { name: { contains: search, mode: "insensitive" } } },
      ...(Number.isInteger(searchAsId) ? [{ id: searchAsId }] : []),
    ];
  }

  try {
    const [total, orders, aggregate] = await Promise.all([
      db.order.count({ where }),
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cashier: { select: { id: true, name: true, role: true } },
          orderItems: { include: { product: true } },
        },
      }),
      db.order.aggregate({
        where: { ...where, status: "PAID" },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
    ]);

    const totalAmount = Number(aggregate._sum.totalAmount || 0);
    const successCount = aggregate._count._all;
    const average = successCount > 0 ? Math.round(totalAmount / successCount) : 0;

    return {
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        invoiceNo: String(o.id).padStart(6, "0"),
        customerName: o.customerName,
        cashierName: o.cashier?.name || "Kasir",
        cashier: o.cashier,
        status: o.status,
        paymentMethod: o.paymentMethod,
        totalAmount: Number(o.totalAmount),
        discount: Number(o.discount || 0),
        note: o.note,
        createdAt: o.createdAt,
        items: o.orderItems.map((item) => ({
          id: item.id,
          productName: item.product?.name || "Produk",
          quantity: item.quantity,
          price: Number(item.price),
        })),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary: {
        totalAmount,
        successCount,
        average,
      },
    };
  } catch (error: any) {
    console.error("TRANSACTIONS LIST ERROR:", error);
    throw createError({ statusCode: 500, statusMessage: "Gagal memuat data transaksi." });
  }
});