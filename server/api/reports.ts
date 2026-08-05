// server/api/reports.ts
import { db } from "../utils/db";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Hanya izinkan method GET untuk mengambil data laporan
  if (method === "GET") {
    try {
      // Ambil seluruh data order/penjualan, diurutkan dari yang terbaru
      const orders = await db.order.findMany({
        include: {
          orderItems: {
            include: {
              product: true, // Menyertakan detail produk yang dibeli
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Hitung ringkasan statistik singkat
      const totalPendapatan = orders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0,
      );
      const totalTransaksi = orders.length;

      return {
        success: true,
        summary: {
          totalPendapatan,
          totalTransaksi,
        },
        data: orders,
      };
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal mengambil laporan penjualan: " + error.message,
      });
    }
  }
});