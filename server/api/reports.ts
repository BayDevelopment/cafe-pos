// server/api/reports.ts
import { db } from "../utils/db";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "GET") {
    throw createError({
      statusCode: 405,
      message: "Method Not Allowed",
    });
  }

  try {
    // 1. Ambil token dari cookie
    const cookies = parseCookies(event);
    const token = cookies.token || cookies.auth_token;

    if (!token) {
      throw createError({
        statusCode: 401,
        message: "Autentikasi gagal: Silakan login terlebih dahulu.",
      });
    }

    // 2. Validasi token via tabel Session (dengan pengecekan expiresAt)
    const session = await db.session.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const sessionUser = session?.user;
    const userRole = sessionUser?.role?.toUpperCase();

    // 3. Validasi role PEMILIK
    if (!sessionUser || userRole !== "PEMILIK") {
      throw createError({
        statusCode: 403,
        message:
          "Akses ditolak: Laporan penjualan hanya dapat diakses oleh Pemilik Toko (Owner).",
      });
    }

    // 4. Ambil filter periode dari query string (opsional)
    const query = getQuery(event);
    const startDate = query.startDate
      ? new Date(query.startDate as string)
      : undefined;
    const endDate = query.endDate ? new Date(query.endDate as string) : undefined;

    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);

    const dateFilter =
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {};

    // 5. Ringkasan (summary) dihitung di level database, bukan di JS
    const aggregate = await db.order.aggregate({
      where: dateFilter,
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalPendapatan = Number(aggregate._sum.totalAmount ?? 0);
    const totalTransaksi = aggregate._count;

    // 6. Data detail order, dengan pagination
    const orders = await db.order.findMany({
      where: dateFilter,
      include: {
        cashier: {
          select: { id: true, name: true },
        },
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      success: true,
      summary: {
        totalPendapatan,
        totalTransaksi,
      },
      pagination: {
        page,
        pageSize,
      },
      data: orders,
    };
  } catch (error: any) {
    console.error("API Error /api/reports:", error);

    // Jangan bocorkan detail error internal ke client untuk error 500
    const isKnownError = typeof error.statusCode === "number";

    throw createError({
      statusCode: error.statusCode || 500,
      message: isKnownError
        ? error.message
        : "Gagal mengambil laporan penjualan.",
    });
  }
});