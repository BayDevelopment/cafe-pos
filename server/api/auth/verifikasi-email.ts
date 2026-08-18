import { defineEventHandler, getQuery } from "h3";
import { db } from "../../utils/db";
import { getAuthUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const token = typeof query.token === "string" ? query.token : "";

    // Fallback role: kalau ada sesi login aktif, dipakai untuk menentukan redirect
    // meskipun proses verifikasi token gagal total (mis. token tidak ada/salah).
    const sessionUser = await getAuthUser(event).catch(() => null);

    if (!token) {
        return {
            success: false,
            message: "Token verifikasi tidak ditemukan pada tautan ini.",
            role: sessionUser?.role ?? null,
        };
    }

    const record = await db.verificationToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record) {
        return {
            success: false,
            message: "Token verifikasi tidak valid.",
            role: sessionUser?.role ?? null,
        };
    }

    // Sekali pakai — kalau usedAt sudah terisi, token ini sudah pernah dipakai.
    if (record.usedAt) {
        return {
            success: false,
            message: "Token verifikasi ini sudah pernah digunakan sebelumnya.",
            role: record.user.role,
        };
    }

    if (record.expiresAt < new Date()) {
        await db.verificationToken.update({
            where: { id: record.id },
            data: { usedAt: new Date() },
        }).catch(() => { });

        return {
            success: false,
            message: "Token verifikasi sudah kedaluwarsa. Silakan kirim ulang email verifikasi.",
            role: record.user.role,
        };
    }

    if (!record.user.emailVerifiedAt) {
        await db.user.update({
            where: { id: record.userId },
            data: { emailVerifiedAt: new Date() },
        });
    }

    await db.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
    });

    return {
        success: true,
        message: "Email berhasil diverifikasi.",
        role: record.user.role,
    };
});