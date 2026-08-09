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
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      statusMessage: "Method not allowed",
    });
  }

  // 1. Verifikasi Otentikasi Kasir / User
  let user = event.context.user;

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
        const rawId = payload.userId ?? payload.id;
        user = { id: rawId, role: payload.role };
        event.context.user = user;
      } catch (e) {
        // Token kadaluarsa
      }
    }
  }

  const cashierIdRaw = user?.id ?? user?.userId;
  const cashierId = cashierIdRaw ? String(cashierIdRaw).trim() : null;

  if (!user || !cashierId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Sesi kasir tidak valid atau Anda belum login",
    });
  }

  // 2. Ekstrak Request Body
  const body = await readBody(event).catch(() => ({}));
  const { items, paymentMethod, totalAmount, discount, note, customerName } = body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Keranjang belanja tidak boleh kosong",
    });
  }

  try {
    // 3. Transaksi Database Atomic dengan Isolation Level & Strict Stock Lock
    const result = await db.$transaction(async (tx) => {
      const orderItemsData = [];

      for (const item of items) {
        const quantity = Number(item.quantity ?? item.qty) || 0;
        const productId = Number(item.productId ?? item.id);

        if (quantity <= 0 || !productId || isNaN(productId)) {
          throw createError({
            statusCode: 400,
            statusMessage: "Data item tidak valid",
          });
        }

        // PERBAIKAN PENTING:
        // Gunakan updateMany dengan kriteria `stock >= quantity` untuk pemotongan atomic aman.
        // Jika kriteria tidak terpenuhi, `count` akan bernilai 0.
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            stock: {
              gte: quantity, // Pastikan stok saat ini LEBIH BESAR atau SAMA DENGAN quantity
            },
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        });

        // Jika tidak ada baris yang ter-update, artinya stok tidak mencukupi atau produk tidak ada
        if (updated.count === 0) {
          // Ambil detail produk untuk memberikan pesan error yang jelas
          const product = await tx.product.findUnique({ where: { id: productId } });
          if (!product) {
            throw createError({
              statusCode: 404,
              statusMessage: `Produk dengan ID ${productId} tidak ditemukan`,
            });
          }
          throw createError({
            statusCode: 400,
            statusMessage: `Stok untuk "${product.name}" tidak mencukupi (Sisa stok: ${product.stock}, diminta: ${quantity})`,
          });
        }

        // Ambil data harga produk untuk record transaksi
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { price: true, name: true },
        });

        orderItemsData.push({
          productId: productId,
          quantity: quantity,
          price: product?.price || 0,
        });
      }

      const formattedCustomerName = customerName ? String(customerName).trim() : null;

      // 4. Buat Record Order
      const createdOrder = await tx.order.create({
        data: {
          customerName: formattedCustomerName,
          paymentMethod: paymentMethod || "CASH",
          totalAmount: Number(totalAmount) || 0,
          discount: Number(discount) || 0,
          note: note ? String(note).trim() : null,
          cashier: {
            connect: { id: cashierId },
          },
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          cashier: {
            select: { id: true, name: true, email: true, role: true },
          },
          orderItems: {
            include: { product: true },
          },
        },
      });

      return createdOrder;
    });

    // 5. Return Response
    return {
      success: true,
      orderId: result.id,
      message: "Transaksi berhasil diproses",
      data: {
        id: result.id,
        invoiceNo:
          typeof result.id === "number"
            ? String(result.id).padStart(6, "0")
            : String(result.id).slice(-8).toUpperCase(),
        customerName: result.customerName || "Pelanggan Umum",
        cashierName: result.cashier?.name || "Kasir",
        cashier: result.cashier,
        totalAmount: Number(result.totalAmount),
        discount: Number(result.discount),
        paymentMethod: result.paymentMethod,
        createdAt: result.createdAt,
        items: result.orderItems.map((item) => ({
          id: item.id,
          productName: item.product?.name || "Produk",
          quantity: item.quantity,
          price: Number(item.price),
        })),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    console.error("ORDER CREATION ERROR:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memproses transaksi: " + (error?.message || "Internal Server Error"),
    });
  }
});