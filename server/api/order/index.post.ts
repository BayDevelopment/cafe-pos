import { db } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { items, paymentMethod, totalAmount, note } = body;

  // 1. Validasi input dasar
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Keranjang belanja tidak boleh kosong",
    });
  }

  try {
    // 2. Transaksi Database Atomic (Jika satu gagal, semua di-rollback)
    const result = await db.$transaction(async (tx) => {
      // Loop tiap item untuk validasi stok dan penyesuaian harga terbaru
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: Number(item.productId) },
        });

        if (!product) {
          throw createError({
            statusCode: 404,
            statusMessage: `Produk dengan ID ${item.productId} tidak ditemukan`,
          });
        }

        if (product.stock < item.quantity) {
          throw createError({
            statusCode: 400,
            statusMessage: `Stok untuk "${product.name}" tidak mencukupi (sisa: ${product.stock})`,
          });
        }

        // Kurangi stok produk
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Simpan data item dengan harga dari database untuk mencegah manipulasi client
        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });
      }

      // 3. Buat record Order beserta seluruh OrderItem terkait
      const createdOrder = await tx.order.create({
        data: {
          paymentMethod: paymentMethod || "CASH",
          totalAmount: totalAmount,
          note: note || null,
          orderItems: {
            create: orderItemsData,
          },
        },
      });

      return createdOrder;
    });

    return {
      success: true,
      orderId: result.id,
      message: "Transaksi berhasil diproses",
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses transaksi: " + error.message,
    });
  }
});