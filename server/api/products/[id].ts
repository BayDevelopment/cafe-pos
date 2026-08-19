// server/api/products/[id].ts
import { defineEventHandler, getMethod, getRouterParam, readMultipartFormData, createError } from "h3";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Prisma } from "../../../generated/prisma/client";
import { db } from "../../utils/db";
import { requireOwner } from "../../utils/auth";

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1 MB
const MAX_NAME_LEN = 200;
const MAX_SKU_LEN = 50;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;
  const hex = buffer.toString("hex", 0, 4).toUpperCase();
  if (hex === "89504E47") return "image/png";
  if (hex.startsWith("FFD8FF")) return "image/jpeg";
  return null;
}

// Mencegah path traversal saat menghapus file fisik.
async function safeDeleteFile(relativePath: string) {
  if (!relativePath || typeof relativePath !== "string") return;

  const filename = path.basename(relativePath);
  const fullPath = path.join(UPLOAD_DIR, filename);

  if (!fullPath.startsWith(UPLOAD_DIR)) return;

  await fs.unlink(fullPath).catch((err) => {
    console.error("Gagal menghapus file fisik:", err);
  });
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const idRaw = getRouterParam(event, "id");

  const productId = Number(idRaw);
  if (!idRaw || !Number.isInteger(productId) || productId <= 0) {
    throw createError({ statusCode: 400, message: "ID produk tidak valid" });
  }

  // Hanya PEMILIK yang boleh mengubah atau menghapus produk.
  if (method === "PUT" || method === "DELETE") {
    await requireOwner(event);
  }

  // ==========================================
  // UPDATE PRODUK (PUT) — HANYA PEMILIK
  // ==========================================
  if (method === "PUT") {
    const files = await readMultipartFormData(event);
    if (!files) {
      throw createError({ statusCode: 400, message: "Invalid form data" });
    }

    const existingProduct = await db.product.findUnique({ where: { id: productId } });
    if (!existingProduct) {
      throw createError({ statusCode: 404, message: "Produk tidak ditemukan" });
    }

    let name = existingProduct.name;
    let sku = existingProduct.sku;
    let price = Number(existingProduct.price);
    let costPrice = existingProduct.costPrice ? Number(existingProduct.costPrice) : null;
    let discount = Number(existingProduct.discount || 0);
    let stock = existingProduct.stock;
    let categoryId = existingProduct.categoryId;
    let isActive = existingProduct.isActive;
    let uploadedFile: { filename: string; data: Buffer } | null = null;

    for (const file of files) {
      const fieldName = file.name;
      const value = file.data.toString("utf-8").trim();

      if (fieldName === "name" && value) {
        if (value.length > MAX_NAME_LEN) {
          throw createError({ statusCode: 400, message: `Nama produk tidak boleh melebihi ${MAX_NAME_LEN} karakter.` });
        }
        name = value;
      }

      if (fieldName === "sku") {
        if (value.length > MAX_SKU_LEN) {
          throw createError({ statusCode: 400, message: `SKU tidak boleh melebihi ${MAX_SKU_LEN} karakter.` });
        }
        sku = value || null;
      }

      if (fieldName === "price" && value !== "") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          throw createError({ statusCode: 400, message: "Harga jual wajib berupa angka lebih dari 0." });
        }
        price = parsed;
      }

      if (fieldName === "costPrice" && value !== "") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw createError({ statusCode: 400, message: "Harga modal harus berupa angka dan tidak boleh negatif." });
        }
        costPrice = parsed;
      }

      if (fieldName === "discount" && value !== "") {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw createError({ statusCode: 400, message: "Diskon produk harus berupa angka dan tidak boleh negatif." });
        }
        discount = parsed;
      }

      if (fieldName === "stock" && value !== "") {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 0) {
          throw createError({ statusCode: 400, message: "Stok harus berupa bilangan bulat dan tidak boleh negatif." });
        }
        stock = parsed;
      }

      if (fieldName === "categoryId" && value !== "") {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw createError({ statusCode: 400, message: "Kategori tidak valid." });
        }
        categoryId = parsed;
      }

      if (fieldName === "isActive") isActive = value === "true";

      if (fieldName === "image" && file.filename && file.data.length > 0) {
        uploadedFile = { filename: file.filename, data: file.data };
      }
    }

    if (discount > price) {
      throw createError({ statusCode: 400, message: "Diskon tidak boleh melebihi harga jual produk." });
    }

    if (categoryId !== existingProduct.categoryId) {
      const categoryExists = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (!categoryExists) {
        throw createError({ statusCode: 400, message: "Kategori tidak ditemukan." });
      }
    }

    let newImagePath: string | undefined = undefined;
    let savedFilePath: string | null = null;

    if (uploadedFile) {
      if (uploadedFile.data.length > MAX_IMAGE_SIZE) {
        throw createError({ statusCode: 400, message: "Ukuran gambar maksimal 1 MB" });
      }

      const detectedMime = getMimeTypeFromBuffer(uploadedFile.data);
      if (!detectedMime || !["image/png", "image/jpeg"].includes(detectedMime)) {
        throw createError({
          statusCode: 400,
          message: "Format gambar ditolak. Hanya PNG dan JPG/JPEG asli yang diizinkan.",
        });
      }

      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      const safeExtension = detectedMime === "image/png" ? ".png" : ".jpg";
      const randomFileName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${safeExtension}`;
      const fullPath = path.join(UPLOAD_DIR, randomFileName);

      await fs.writeFile(fullPath, uploadedFile.data);
      savedFilePath = fullPath;
      newImagePath = `/uploads/${randomFileName}`;
    }

    try {
      const updatedProduct = await db.product.update({
        where: { id: productId },
        data: {
          name,
          sku,
          price,
          costPrice,
          discount,
          stock,
          categoryId,
          isActive,
          ...(newImagePath !== undefined && { image: newImagePath }),
        },
      });

      if (newImagePath && existingProduct.image) {
        await safeDeleteFile(existingProduct.image);
      }

      return {
        success: true,
        message: "Produk berhasil diperbarui",
        data: {
          ...updatedProduct,
          price: Number(updatedProduct.price),
          discount: Number(updatedProduct.discount),
          costPrice: updatedProduct.costPrice ? Number(updatedProduct.costPrice) : null,
        },
      };
    } catch (error: any) {
      if (savedFilePath) await fs.unlink(savedFilePath).catch(() => {});

      const errorCode = String(error?.code || "");
      if (errorCode === "P2002") {
        throw createError({ statusCode: 409, message: "SKU produk sudah digunakan." });
      }
      if (errorCode === "P2003") {
        throw createError({ statusCode: 400, message: "Kategori tidak valid." });
      }

      console.error("Gagal memperbarui produk:", error);
      throw createError({ statusCode: 500, message: "Gagal memperbarui produk." });
    }
  }

  // ==========================================
  // HAPUS PRODUK (DELETE) — HANYA PEMILIK
  // ==========================================
  if (method === "DELETE") {
    try {
      // 1. Cek keberadaan produk beserta jumlah riwayat pesanannya
      const existingProduct = await db.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          image: true,
          _count: {
            select: {
              orderItems: true,
              orderRequestItems: true,
            },
          },
        },
      });

      if (!existingProduct) {
        throw createError({ statusCode: 404, message: "Produk tidak ditemukan." });
      }

      // 2. Jika sudah terikat riwayat transaksi -> Otomatis Soft Delete (isActive: false)
      const hasTransactionHistory =
        (existingProduct._count?.orderItems ?? 0) > 0 ||
        (existingProduct._count?.orderRequestItems ?? 0) > 0;

      if (hasTransactionHistory) {
        const softDeletedProduct = await db.product.update({
          where: { id: productId },
          data: { isActive: false },
        });

        return {
          success: true,
          message: "Produk memiliki riwayat transaksi. Status diubah menjadi Non-Aktif.",
          data: {
            ...softDeletedProduct,
            price: Number(softDeletedProduct.price),
            discount: Number(softDeletedProduct.discount),
            costPrice: softDeletedProduct.costPrice ? Number(softDeletedProduct.costPrice) : null,
          },
        };
      }

      // 3. Jika belum ada riwayat transaksi -> Hard Delete permanen
      const deletedProduct = await db.product.delete({ where: { id: productId } });

      if (deletedProduct.image) {
        await safeDeleteFile(deletedProduct.image);
      }

      return {
        success: true,
        message: "Produk berhasil dihapus secara permanen.",
        data: deletedProduct,
      };
    } catch (error: any) {
      if (error.statusCode) throw error;

      // Fallback pencegahan error Foreign Key Constraint (P2003 Prisma / 23001 Postgres)
      const errorCode = String(error?.code || "");
      const errorMessage = String(error?.message || "");

      if (
        errorCode === "P2003" ||
        errorCode === "23001" ||
        errorMessage.includes("foreign key constraint") ||
        errorMessage.includes("RESTRICT")
      ) {
        const softDeletedProduct = await db.product.update({
          where: { id: productId },
          data: { isActive: false },
        });

        return {
          success: true,
          message: "Produk memiliki riwayat transaksi. Status diubah menjadi Non-Aktif.",
          data: {
            ...softDeletedProduct,
            price: Number(softDeletedProduct.price),
            discount: Number(softDeletedProduct.discount),
            costPrice: softDeletedProduct.costPrice ? Number(softDeletedProduct.costPrice) : null,
          },
        };
      }

      console.error("Gagal menghapus produk:", error);
      throw createError({ statusCode: 500, message: "Gagal menghapus produk." });
    }
  }

  throw createError({ statusCode: 405, message: "Method not allowed" });
});