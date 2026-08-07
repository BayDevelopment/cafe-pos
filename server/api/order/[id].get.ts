import { db } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  // Validasi jika ID tidak ada atau bukan angka
  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID pesanan tidak valid",
    });
  }

  try {
    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: {
        // Opsional: tambahkan relasi kasir/user jika ada di skema
        cashier: {
          select: {
            id: true,
            name: true,
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
    // Cegah error yang sudah dibuat (seperti 404/400) dibungkus ulang menjadi 500
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pesanan: " + error.message,
    });
  }
});