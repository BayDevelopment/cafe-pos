import { defineEventHandler, getQuery, createError } from "h3";
import { db } from "../../../utils/db";
import { requireUser } from "../../../utils/auth";

// Regex sederhana untuk validasi format YYYY-MM-DD
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ubah string "YYYY-MM-DD" menjadi Date pada awal hari (00:00:00.000) waktu lokal server.
 * Mengembalikan null jika format tidak valid.
 */
function parseStartOfDay(dateStr: unknown): Date | null {
    if (typeof dateStr !== "string" || !DATE_ONLY_REGEX.test(dateStr)) return null;
    const d = new Date(`${dateStr}T00:00:00.000`);
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Ubah string "YYYY-MM-DD" menjadi Date pada akhir hari (23:59:59.999) waktu lokal server.
 * Mengembalikan null jika format tidak valid.
 */
function parseEndOfDay(dateStr: unknown): Date | null {
    if (typeof dateStr !== "string" || !DATE_ONLY_REGEX.test(dateStr)) return null;
    const d = new Date(`${dateStr}T23:59:59.999`);
    return isNaN(d.getTime()) ? null : d;
}

export default defineEventHandler(async (event) => {
    const authUser = await requireUser(event);
    const role = String(authUser.role).toUpperCase();

    if (role !== "KASIR" && role !== "PEMILIK") {
        throw createError({
            statusCode: 403,
            statusMessage: "Akses ditolak.",
        });
    }

    const query = getQuery(event);
    const statusQuery = typeof query.status === "string" ? query.status.toUpperCase() : "PENDING";
    // Pagination
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    // Filter status (jika ALL, tampilkan semua status)
    const where: Record<string, any> = {};
    if (statusQuery !== "ALL") {
        where.status = statusQuery;
    }

    // Filter tanggal (opsional): startDate & endDate berformat YYYY-MM-DD
    const startDate = parseStartOfDay(query.startDate);
    const endDate = parseEndOfDay(query.endDate);

    if (query.startDate && !startDate) {
        throw createError({
            statusCode: 400,
            statusMessage: "Format startDate tidak valid. Gunakan YYYY-MM-DD.",
        });
    }
    if (query.endDate && !endDate) {
        throw createError({
            statusCode: 400,
            statusMessage: "Format endDate tidak valid. Gunakan YYYY-MM-DD.",
        });
    }
    if (startDate && endDate && startDate > endDate) {
        throw createError({
            statusCode: 400,
            statusMessage: "startDate tidak boleh setelah endDate.",
        });
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    // Fetch data paralel
    const [requests, total, pendingCount] = await Promise.all([
        db.orderRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                items: {
                    include: { product: true },
                },
            },
        }),
        db.orderRequest.count({ where }),
        db.orderRequest.count({ where: { status: "PENDING" } }),
    ]);

    // Format response dengan perhitungan diskon
    const data = requests.map((req) => {
        let itemDiscountTotal = 0;

        const items = req.items.map((item) => {
            const originalPrice = Number(item.price || item.product?.price || 0);
            const productDiscount = Number(item.product?.discount || 0);
            // Perhitungan harga bersih per item
            const finalPrice = Math.max(0, originalPrice - productDiscount);
            itemDiscountTotal += productDiscount * item.quantity;

            const discountPercent = originalPrice > 0
                ? Math.round((productDiscount / originalPrice) * 100)
                : 0;

            return {
                id: item.id,
                productId: item.productId,
                productName: item.product?.name || (item as any).productName || "Produk",
                quantity: item.quantity,
                originalPrice,
                discount: productDiscount,
                discountPercent,
                price: finalPrice, // Harga setelah diskon
                subtotal: finalPrice * item.quantity,
            };
        });

        // Total akumulasi harga bersih
        const calculatedTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const orderDiscount = Number((req as any).discount || 0);
        const netEstimatedTotal = Number(req.estimatedTotal) > 0
            ? Number(req.estimatedTotal)
            : Math.max(0, calculatedTotal - orderDiscount);

        return {
            id: req.id,
            customerName: req.customerName || "Anonim",
            status: req.status,
            note: req.note || null,
            totalDiscount: itemDiscountTotal + orderDiscount,
            estimatedTotal: netEstimatedTotal,
            createdAt: req.createdAt,
            items,
        };
    });

    return {
        success: true,
        data,
        pendingCount,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
});