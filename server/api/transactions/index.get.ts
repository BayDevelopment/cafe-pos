import { defineEventHandler, getQuery } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";

const ALLOWED_STATUS = ["PENDING", "PAID", "CANCELLED", "REFUNDED"];
const ALLOWED_PAYMENT = ["CASH", "QRIS", "DEBIT", "KREDIT", "TRANSFER"];

function todayWibDateString(): string {
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return wib.toISOString().split("T")[0];
}
function wibDayStartUtc(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00.000+07:00`);
}
function wibDayEndUtc(dateStr: string): Date {
    return new Date(`${dateStr}T23:59:59.999+07:00`);
}

export default defineEventHandler(async (event) => {
    const authUser = await requireUser(event);
    const isOwner = String(authUser.role).toUpperCase() === "PEMILIK";

    const query = getQuery(event);

    // --- Pagination ---
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    // --- Filter dasar ---
    const where: Record<string, any> = {};

    // KASIR hanya boleh lihat transaksi HARI INI (WIB).
    // PEMILIK bebas, tapi tetap hormati startDate/endDate kalau dikirim.
    let startDate = typeof query.startDate === "string" ? query.startDate : undefined;
    let endDate = typeof query.endDate === "string" ? query.endDate : undefined;

    if (!isOwner) {
        const today = todayWibDateString();
        startDate = today;
        endDate = today;
    }

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = wibDayStartUtc(startDate);
        if (endDate) where.createdAt.lte = wibDayEndUtc(endDate);
    }

    if (typeof query.status === "string" && query.status) {
        const status = query.status.toUpperCase();
        if (ALLOWED_STATUS.includes(status)) {
            where.status = status;
        }
    }

    if (typeof query.paymentMethod === "string" && query.paymentMethod) {
        const method = query.paymentMethod.toUpperCase();
        if (ALLOWED_PAYMENT.includes(method)) {
            where.paymentMethod = method;
        }
    }

    if (typeof query.search === "string" && query.search.trim()) {
        const search = query.search.trim();
        const searchAsNumber = Number(search);

        where.OR = [
            { customerName: { contains: search, mode: "insensitive" } },
            ...(Number.isInteger(searchAsNumber) ? [{ id: searchAsNumber }] : []),
            { cashier: { name: { contains: search, mode: "insensitive" } } },
        ];
    }

    // --- Query utama + total count secara paralel ---
    const [orders, total] = await Promise.all([
        db.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                cashier: { select: { id: true, name: true, role: true } },
                orderItems: { include: { product: true } },
            },
        }),
        db.order.count({ where }),
    ]);

    const data = orders.map((order) => ({
        id: order.id,
        invoiceNo: String(order.id).padStart(6, "0"),
        customerName: order.customerName,
        cashierName: order.cashier?.name || "Kasir",
        cashier: order.cashier,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalAmount: Number(order.totalAmount),
        discount: Number(order.discount || 0),
        note: order.note,
        createdAt: order.createdAt,
        items: order.orderItems.map((item) => ({
            id: item.id,
            productName: item.product?.name || "Produk",
            quantity: item.quantity,
            price: Number(item.price),
        })),
    }));

    // --- Ringkasan (khusus status PAID, sesuai hasil filter/tanggal di atas) ---
    const paidWhere = { ...where, status: "PAID" };
    const paidAggregate = await db.order.aggregate({
        where: paidWhere,
        _sum: { totalAmount: true },
        _count: { _all: true },
    });

    const successCount = paidAggregate._count._all || 0;
    const totalAmount = Number(paidAggregate._sum.totalAmount || 0);
    const average = successCount > 0 ? Math.round(totalAmount / successCount) : 0;

    return {
        success: true,
        data,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
        summary: {
            totalAmount,
            successCount,
            average,
        },
    };
});