// server/api/transactions.get.ts
import { db } from "../utils/db";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId?: string | number;
  id?: string | number;
  role: "PEMILIK" | "KASIR";
}

export default defineEventHandler(async (event) => {
  // 1. Verifikasi Otentikasi JWT
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
        // Token tidak valid atau kadaluarsa
      }
    }
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Anda harus login untuk mengakses riwayat transaksi",
    });
  }

  // Normalisasi role user
  const userRole = String(user.role || "").toUpperCase();
  const isOwner = userRole === "PEMILIK";

  // 2. Query Parameters dari Client
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 20);
  const skip = (page - 1) * limit;

  const search = query.search ? String(query.search).trim() : "";
  const status = query.status ? String(query.status) : undefined;
  const paymentMethod = query.paymentMethod ? String(query.paymentMethod) : undefined;

  // 3. Menyusun Filter Prisma (whereCondition)
  const whereCondition: any = {};

  if (status) {
    whereCondition.status = status;
  }

  if (paymentMethod) {
    whereCondition.paymentMethod = paymentMethod;
  }

  // --- PEMBATASAN ROLE KASIR (Hanya Hari Ini) ---
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  if (!isOwner) {
    // Jika user adalah KASIR, paksa filter createdAt hanya hari ini
    whereCondition.createdAt = {
      gte: todayStart,
      lte: todayEnd,
    };
  } else {
    // Jika PEMILIK, cek apakah ada filter tanggal opsional dari query
    const startDate = query.startDate ? new Date(String(query.startDate)) : null;
    const endDate = query.endDate ? new Date(String(query.endDate)) : null;

    if (startDate || endDate) {
      whereCondition.createdAt = {};
      if (startDate) {
        startDate.setHours(0, 0, 0, 0);
        whereCondition.createdAt.gte = startDate;
      }
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        whereCondition.createdAt.lte = endDate;
      }
    }
  }

  // PERBAIKAN SEARCH PRISMA (Memisahkan numeric ID & string fields + Nama Kasir)
  if (search) {
    const isNumberSearch = !isNaN(Number(search));

    whereCondition.OR = [
      // Jika input berupa angka, cari berdasarkan ID tepat
      ...(isNumberSearch ? [{ id: Number(search) }] : []),
      // Cari berdasarkan nama pelanggan
      { customerName: { contains: search, mode: "insensitive" } },
      // Cari berdasarkan nama kasir (Relasi User/Cashier)
      { cashier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    // 4. Query Data & Count dari Database
    const [total, orders] = await Promise.all([
      db.order.count({ where: whereCondition }),
      db.order.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip: skip,
        take: limit,
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
    ]);

    // 5. Transformasi Data agar Sesuai Komponen Frontend
    const formattedData = orders.map((order: any) => {
      // Normalisasi status database ke format frontend ("SUCCESS" atau "CANCELLED")
      const rawStatus = String(order.status || "").toUpperCase();
      const isSuccess = !rawStatus || ["PAID", "SUCCESS", "COMPLETED"].includes(rawStatus);
      const normalizedStatus = isSuccess ? "SUCCESS" : "CANCELLED";

      // Format Nomor Faktur/Invoice
      const invoiceNo =
        typeof order.id === "number"
          ? String(order.id).padStart(6, "0")
          : String(order.id).slice(-8).toUpperCase();

      return {
        id: order.id,
        invoiceNo: invoiceNo,
        createdAt: order.createdAt,
        customerName: order.customerName || "Pelanggan Umum",
        cashier: order.cashier || null,
        cashierName: order.cashier?.name || "Kasir",
        paymentMethod: order.paymentMethod || "CASH",
        status: normalizedStatus,
        subtotal: Number(order.totalAmount || 0),
        discount: Number(order.discount || 0),
        tax: Number(order.tax || 0),
        totalAmount: Number(order.totalAmount || 0),
        note: order.note || "",
        items: order.orderItems
          ? order.orderItems.map((item: any) => ({
              id: item.id,
              productName: item.product?.name || "Produk",
              qty: item.quantity,
              price: Number(item.price),
              note: item.note || "",
            }))
          : [],
      };
    });

    // 6. Ringkasan Halaman Ini
    const successOrders = formattedData.filter((o) => o.status === "SUCCESS");
    const totalAmount = successOrders.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const successCount = successOrders.length;
    const average =
      successCount > 0 ? Math.round(totalAmount / successCount) : 0;

    return {
      success: true,
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalAmount,
        successCount,
        average,
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memuat transaksi: " + error.message,
    });
  }
});