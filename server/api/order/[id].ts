// server/api/orders/[id].ts
import { db } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;

  try {
    const order = await db.order.findUnique({
      where: { id: Number(id) },
      include: {
        orderItems: {
          include: {
            product: true,
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
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal mengambil data pesanan: " + error.message,
    });
  }
});