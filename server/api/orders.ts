// server/api/orders.ts
import { db } from "../utils/db";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "POST") {
    try {
      const body = await readBody(event);
      const { paymentMethod, totalAmount, items } = body;

      // Simpan order dan orderItems secara transaksi database (transaction)
      const newOrder = await db.$transaction(async (tx) => {
        // 1. Buat data order utama
        const order = await tx.order.create({
          data: {
            totalAmount,
            paymentMethod,
          },
        });

        // 2. Buat relasi order items & kurangi stok produk
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            },
          });

          // Kurangi stok produk
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        return order;
      });

      return {
        success: true,
        orderId: newOrder.id,
        message: "Transaksi berhasil diproses",
      };
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: "Gagal menyimpan transaksi: " + error.message,
      });
    }
  }
});
