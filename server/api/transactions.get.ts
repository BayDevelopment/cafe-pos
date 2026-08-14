// server/api/transactions.get.ts
import { db } from "../utils/db";
import { requireUser } from "../utils/auth";
import { OrderStatus, Role } from "../../generated/prisma/enums";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export default defineEventHandler(async (event) => {
  // 1. Verifikasi Otentikasi & Otorisasi — lewat helper terpusat (tanpa fallback secret,
  //    fail closed kalau JWT_SECRET tidak diset, dicek ulang terhadap DB & status aktif user).
  const user = await requireUser(event);
  const isOwner = user.role === Role.PEMILIK;

  // 2. Query Parameters dari Client
  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  // Batasi limit maksimal supaya query tidak bisa dipaksa menarik jutaan baris sekaligus.
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const search = query.search ? String(query.search).trim().slice(0, 100) : "";
  const statusQuery = query.status ? String(query.status).toUpperCase() : undefined;
  const paymentMethod = query.paymentMethod ? String(query.paymentMethod).slice(0, 30) : undefined;

  // 3. Menyusun Filter Prisma (whereCondition)
  const whereCondition: any = {};

  if (statusQuery) {
    if (statusQuery === "SUCCESS") {
      whereCondition.status = OrderStatus.PAID;
    } else if (statusQuery === "CANCELLED") {
      whereCondition.status = OrderStatus.CANCELLED;
    } else if (Object.values(OrderStatus).includes(statusQuery as OrderStatus)) {
      whereCondition.status = statusQuery as OrderStatus;
    }
  }

  if (paymentMethod) {
    whereCondition.paymentMethod = paymentMethod;
  }

  // --- HAK AKSES DAN KONTROL TANGGAL BERDASARKAN ROLE ---
  if (!isOwner) {
    // KASIR: dibatasi hanya transaksi milik dirinya sendiri, HARI INI saja.
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    whereCondition.createdAt = { gte: todayStart, lte: todayEnd };
    // Kasir hanya boleh melihat transaksinya sendiri, bukan milik kasir lain.
    whereCondition.cashierId = user.id;
  } else {
    // PEMILIK: bebas melihat riwayat kapan saja; filter tanggal hanya kalau dikirim query.
    const rawStart = query.startDate ? new Date(String(query.startDate)) : null;
    const rawEnd = query.endDate ? new Date(String(query.endDate)) : null;

    const startDate = rawStart && !isNaN(rawStart.getTime()) ? rawStart : null;
    const endDate = rawEnd && !isNaN(rawEnd.getTime()) ? rawEnd : null;

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

  // 4. FILTER PENCARIAN (Search)
  if (search) {
    const isNumberSearch = /^\d+$/.test(search);

    whereCondition.OR = [
      ...(isNumberSearch ? [{ id: Number(search) }] : []),
      { customerName: { contains: search, mode: "insensitive" } },
      { cashier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    // 5. Query Data & Count dari Database
    const [total, orders] = await Promise.all([
      db.order.count({ where: whereCondition }),
      db.order.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
              // Email hanya relevan untuk Pemilik; kasir tidak perlu (dan tidak seharusnya)
              // melihat email kasir lain. Prisma select di-set kondisional di bawah.
              ...(isOwner ? { email: true } : {}),
            },
          },
          orderItems: {
            include: { product: true },
          },
        },
      }),
    ]);

    // 6. Transformasi Data untuk Frontend
    const formattedData = orders.map((order: any) => {
      const isSuccess = order.status === OrderStatus.PAID;
      const normalizedStatus = isSuccess ? "SUCCESS" : "CANCELLED";

      const invoiceNo =
        order.invoiceNo ||
        (typeof order.id === "number"
          ? String(order.id).padStart(6, "0")
          : String(order.id).slice(-8).toUpperCase());

      return {
        id: order.id,
        invoiceNo,
        createdAt: order.createdAt,
        customerName: order.customerName || "Pelanggan Umum",
        cashier: order.cashier || null,
        cashierName: order.cashier?.name || "Kasir",
        paymentMethod: order.paymentMethod || "CASH",
        status: normalizedStatus,
        subtotal: Number(order.subtotal || order.totalAmount || 0),
        discount: Number(order.discount || 0),
        tax: Number(order.tax || 0),
        totalAmount: Number(order.totalAmount || 0),
        note: order.note || "",
        items: order.orderItems
          ? order.orderItems.map((item: any) => ({
              id: item.id,
              productName: item.product?.name || "Produk",
              qty: item.quantity ?? item.qty ?? 1,
              price: Number(item.price || 0),
              note: item.note || "",
            }))
          : [],
      };
    });

    // 7. Kalkulasi Ringkasan Data
    const successOrders = formattedData.filter((o) => o.status === "SUCCESS");
    const totalAmount = successOrders.reduce((sum, item) => sum + item.totalAmount, 0);
    const successCount = successOrders.length;
    const average = successCount > 0 ? Math.round(totalAmount / successCount) : 0;

    return {
      success: true,
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: { totalAmount, successCount, average },
    };
  } catch (error: any) {
    // Jangan bocorkan detail error internal (nama tabel/kolom Prisma dsb.) ke client.
    console.error("Gagal memuat transaksi:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal memuat transaksi. Silakan coba lagi.",
    });
  }
});