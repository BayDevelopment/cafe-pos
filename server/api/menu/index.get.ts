// server/api/menu/index.get.ts
import { defineEventHandler, getQuery, createError } from "h3";
import { db } from "../../utils/db";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event);
        const search = query.search ? String(query.search).trim().slice(0, 100) : "";
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));

        const where: any = {
            isActive: true,
            stock: { gt: 0 },
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
            ];
        }

        const products = await db.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                price: true,
                discount: true, // <-- TAMBAHKAN KAN KOLOM DISCOUNT DI SINI
                stock: true,
                image: true,
                category: { select: { id: true, name: true } },
            },
            orderBy: { name: "asc" },
            take: limit,
        });

        return { success: true, data: products };
    } catch (error) {
        console.error("Gagal mengambil menu publik:", error);
        throw createError({ statusCode: 500, statusMessage: "Gagal memuat menu." });
    }
});