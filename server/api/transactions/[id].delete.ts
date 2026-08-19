// server/api/transactions/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from "h3";
import { db } from "../../utils/db";
import { requireOwner } from "../../utils/auth";

export default defineEventHandler(async (event) => {
    await requireOwner(event);

    const idParam = getRouterParam(event, "id");
    const orderId = Number(idParam);

    if (!orderId || isNaN(orderId)) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID Transaksi tidak valid",
        });
    }

    try {
        const existingOrder = await db.order.findUnique({
            where: { id: orderId },
            select: { id: true },
        });

        if (!existingOrder) {
            throw createError({
                statusCode: 404,
                statusMessage: `Transaksi #${String(orderId).padStart(6, "0")} tidak ditemukan`,
            });
        }

        await db.order.delete({
            where: { id: orderId },
        });

        return {
            success: true,
            message: `Transaksi #${String(orderId).padStart(6, "0")} berhasil dihapus`,
        };
    } catch (error: any) {
        if (error?.statusCode) throw error;

        console.error("Gagal menghapus transaksi:", error);
        throw createError({
            statusCode: 500,
            statusMessage: "Gagal menghapus transaksi. Silakan coba lagi.",
        });
    }
});