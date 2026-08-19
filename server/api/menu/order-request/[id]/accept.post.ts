import { defineEventHandler, getRouterParam, createError } from "h3";
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

    // 2. Validasi ID Param
    const id = Number(getRouterParam(event, "id"));
    if (!id || isNaN(id)) {
        throw createError({
            statusCode: 400,
            statusMessage: "ID pesanan tidak valid.",
        });
    }

    // 3. Ambil data Order Request beserta Produknya
    const orderRequest = await db.orderRequest.findUnique({
        where: { id },
        include: {
            items: {
                include: { product: true },
            },
        },
    });

    if (!orderRequest) {
        throw createError({
            statusCode: 404,
            statusMessage: "Pesanan tidak ditemukan.",
        });
    }

    // 4. Pastikan status pesanan masih PENDING
    if (orderRequest.status !== "PENDING") {
        throw createError({
            statusCode: 400,
            statusMessage: `Pesanan gagal diproses karena status saat ini: ${orderRequest.status}.`,
        });
    }

    // 5. Eksekusi Pemotongan Stok, Membuat Order, & Update Status OrderRequest
    try {
        const result = await db.$transaction(async (tx) => {
            // Cek stok seluruh item terlebih dahulu
            for (const item of orderRequest.items) {
                const product = item.product;

                if (!product) {
                    throw createError({
                        statusCode: 404,
                        statusMessage: `Produk dengan ID ${item.productId} tidak ditemukan.`,
                    });
                }

                if (product.stock < item.quantity) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: `Stok "${product.name}" tidak mencukupi (Tersisa: ${product.stock}, Diminta: ${item.quantity}).`,
                    });
                }
            }

            // Potong stok masing-masing produk
            for (const item of orderRequest.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Hitung kalkulasi diskon dan total amount
            let totalDiscount = 0;
            let totalAmount = 0;

            const orderItemsData = orderRequest.items.map((item) => {
                const originalPrice = Number(item.price || item.product?.price || 0);
                const productDiscount = Number(item.product?.discount || 0);
                const finalPrice = Math.max(0, originalPrice - productDiscount);

                totalDiscount += productDiscount * item.quantity;
                totalAmount += finalPrice * item.quantity;

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: finalPrice,
                };
            });

            // 🌟 BUAT TRANSAKSI BARU (Sesuai model Order & OrderItem)
            const newOrder = await tx.order.create({
                data: {
                    cashierId: String(authUser.id),
                    customerName: orderRequest.customerName || "Pelanggan (Tamu)",
                    totalAmount,
                    discount: totalDiscount,
                    note: orderRequest.note || null,
                    orderItems: {
                        create: orderItemsData,
                    },
                },
                include: {
                    orderItems: true,
                },
            });

            // Update status OrderRequest menjadi ACCEPTED
            const updatedRequest = await tx.orderRequest.update({
                where: { id },
                data: { status: "ACCEPTED" },
                include: {
                    items: {
                        include: { product: true },
                    },
                },
            });

            return {
                orderRequest: updatedRequest,
                order: newOrder,
            };
        });

        return {
            success: true,
            message: "Pesanan berhasil diterima dan dimasukkan ke tabel Order.",
            data: result,
        };
    } catch (error: any) {
        if (error.statusCode) throw error;
        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Gagal memproses penerimaan pesanan.",
        });
    }
});