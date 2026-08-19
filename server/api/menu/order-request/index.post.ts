import { defineEventHandler, readBody, createError } from "h3";
import { db } from "../../../utils/db";
import { getOrCreateGuestSessionId } from "../../../utils/guestSession";

const MAX_ITEMS = 30;
const MAX_QTY_PER_ITEM = 50;
const MAX_NOTE_LEN = 300;
const MAX_NAME_LEN = 100;

export default defineEventHandler(async (event) => {
    const sessionId = getOrCreateGuestSessionId(event);
    const body = await readBody(event);

    const customerName = body?.customerName ? String(body.customerName).trim().slice(0, MAX_NAME_LEN) : null;
    const note = body?.note ? String(body.note).trim().slice(0, MAX_NOTE_LEN) : null;
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    if (rawItems.length === 0) {
        throw createError({ statusCode: 400, statusMessage: "Keranjang tidak boleh kosong." });
    }
    if (rawItems.length > MAX_ITEMS) {
        throw createError({ statusCode: 400, statusMessage: `Maksimal ${MAX_ITEMS} jenis produk per pesanan.` });
    }

    // Validasi & normalisasi tiap item dari input pelanggan
    const parsedItems: { productId: number; quantity: number }[] = [];
    for (const raw of rawItems) {
        const productId = Number(raw?.productId);
        const quantity = Number(raw?.quantity);

        if (!Number.isInteger(productId) || productId <= 0) {
            throw createError({ statusCode: 400, statusMessage: "Produk tidak valid dalam keranjang." });
        }
        if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_QTY_PER_ITEM) {
            throw createError({ statusCode: 400, statusMessage: "Jumlah pesanan tidak valid." });
        }

        parsedItems.push({ productId, quantity });
    }

    // Ambil data produk asli dari DB — JANGAN percaya harga/nama dari body request
    const productIds = parsedItems.map((i) => i.productId);
    const products = await db.product.findMany({
        where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of parsedItems) {
        const product = productMap.get(item.productId);
        if (!product) {
            throw createError({ statusCode: 400, statusMessage: "Salah satu produk tidak tersedia lagi." });
        }
        if (product.stock < item.quantity) {
            throw createError({
                statusCode: 400,
                statusMessage: `Stok "${product.name}" tidak mencukupi (tersisa ${product.stock}).`,
            });
        }
    }

    // Buat OrderRequest + OrderRequestItem dalam satu transaksi
    const orderRequest = await db.orderRequest.create({
        data: {
            sessionId,
            customerName,
            note,
            status: "PENDING",
            items: {
                create: parsedItems.map((item) => {
                    const product = productMap.get(item.productId)!;
                    return {
                        productId: product.id,
                        productName: product.name,
                        price: product.price,
                        quantity: item.quantity,
                    };
                }),
            },
        },
        include: { items: true },
    });

    return { success: true, orderRequestId: orderRequest.id };
});