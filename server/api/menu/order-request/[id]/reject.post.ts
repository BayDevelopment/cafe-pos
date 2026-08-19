import { defineEventHandler, getRouterParam, readBody, createError } from "h3";
import { db } from "../../../../utils/db";
import { requireUser } from "../../../../utils/auth";

export default defineEventHandler(async (event) => {
    // 1. Otorisasi Role (Hanya KASIR & PEMILIK)
    const authUser = await requireUser(event);
    const role = String(authUser.role).toUpperCase();

    if (role !== "KASIR" && role !== "PEMILIK") {
        throw createError({
            statusCode: 403,
            statusMessage: "Akses ditolak.",
        });
    }

    // 2. Validasi Parameter ID
    const id = Number(getRouterParam(event, "id"));
    if (!id || isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID pesanan tidak valid.",
        });
    }

    // 3. Cek Keberadaan Pesanan
    const existingOrder = await db.orderRequest.findUnique({
        where: { id },
    });

    if (!existingOrder) {
        throw createError({
            statusCode: 404,
            statusMessage: "Pesanan tidak ditemukan.",
        });
    }

    // 4. Pastikan Status Masih PENDING
    if (existingOrder.status !== "PENDING") {
        throw createError({
            statusCode: 400,
            statusMessage: `Pesanan gagal ditolak karena status saat ini: ${existingOrder.status}.`,
        });
    }

    // 5. Baca Request Body secara Aman
    const body = await readBody(event).catch(() => ({}));
    const reason = body?.reason?.trim();

    // Format catatan: gabungkan alasan penolakan tanpa menimpa catatan asli pelanggan
    let updatedNote = existingOrder.note || "";
    if (reason) {
        updatedNote = updatedNote 
            ? `${updatedNote} | [DITOLAK: ${reason}]` 
            : `[DITOLAK: ${reason}]`;
    }

    // 6. Update Status Pesanan Menjadi REJECTED
    try {
        const updated = await db.orderRequest.update({
            where: { id },
            data: { 
                status: "REJECTED",
                note: updatedNote || existingOrder.note,
            },
            include: {
                items: {
                    include: { product: true },
                },
            },
        });

        return { 
            success: true, 
            message: "Pesanan berhasil ditolak.",
            data: updated 
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Gagal menolak pesanan.",
        });
    }
});