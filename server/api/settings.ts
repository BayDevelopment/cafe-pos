// server/api/settings.ts
import { defineEventHandler, getMethod, readMultipartFormData, createError } from "h3";
import { db } from "../utils/db";
import { requireOwner } from "../utils/auth";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

const MAX_SHOP_NAME_LEN = 255;
const MAX_DESCRIPTION_LEN = 300;
const MAX_ADDRESS_LEN = 500;
const MAX_PHONE_LEN = 20;

const PHONE_REGEX = /^[0-9+()\-\s]{6,20}$/;

// Nama store Blob — namespace khusus logo toko
const LOGO_STORE_NAME = "shop-logos";

function detectImageType(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";

  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "png";

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";

  return null;
}

function extMatchesDetectedType(ext: string, detected: "jpg" | "png" | "webp"): boolean {
  if (detected === "jpg") return ext === ".jpg" || ext === ".jpeg";
  if (detected === "png") return ext === ".png";
  if (detected === "webp") return ext === ".webp";
  return false;
}

function contentTypeFor(ext: string): string {
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "image/webp";
}

function toSnakeCaseResponse(settings: {
  shopName: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
}) {
  return {
    shop_name: settings.shopName,
    description: settings.description,
    address: settings.address,
    phone: settings.phone,
    logo_url: settings.logoUrl,
  };
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "POST" || method === "PUT") {
    await requireOwner(event);
  }

  if (method === "GET") {
    let settings = await db.shopSettings.findUnique({ where: { id: "GLOBAL_SETTINGS" } });

    if (!settings) {
      settings = await db.shopSettings.create({
        data: {
          id: "GLOBAL_SETTINGS",
          shopName: "Toko Baru",
          description: "",
          address: "",
          phone: "",
          logoUrl: null,
        },
      });
    }

    return { success: true, data: toSnakeCaseResponse(settings) };
  }

  if (method === "POST" || method === "PUT") {
    const files = await readMultipartFormData(event);

    // Inisialisasi Netlify Blobs dengan kredensial Environment Variables
    const logoStore = getStore({
      name: LOGO_STORE_NAME,
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN,
      consistency: "strong",
    });

    let shopName = "";
    let description = "";
    let address = "";
    let phone = "";
    let logoUrl: string | undefined = undefined;
    let savedBlobKey: string | null = null;

    if (files) {
      for (const file of files) {
        if (file.name === "shop_name") shopName = file.data.toString("utf8").trim();
        if (file.name === "description") description = file.data.toString("utf8").trim();
        if (file.name === "address") address = file.data.toString("utf8").trim();
        if (file.name === "phone") phone = file.data.toString("utf8").trim();

        if (file.name === "logo" && file.filename && file.data.length > 0) {
          if (file.data.length > MAX_LOGO_SIZE) {
            throw createError({ statusCode: 400, message: "Ukuran file logo terlalu besar. Batas maksimal adalah 1 MB." });
          }

          const dotIndex = file.filename.lastIndexOf(".");
          const ext = dotIndex >= 0 ? file.filename.slice(dotIndex).toLowerCase() : "";
          if (!ALLOWED_EXT.includes(ext)) {
            throw createError({ statusCode: 400, message: "Format file tidak sah. Hanya file berformat .jpg, .jpeg, .png, atau .webp yang diizinkan." });
          }

          const detected = detectImageType(file.data);
          if (!detected || !extMatchesDetectedType(ext, detected)) {
            throw createError({ statusCode: 400, message: "Isi file tidak sesuai dengan format gambar yang diklaim." });
          }

          // Key acak & unik — dipakai sebagai "nama file" di dalam Blob store.
          const key = `logo_${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;

          const arrayBuffer = file.data.buffer.slice(
            file.data.byteOffset,
            file.data.byteOffset + file.data.byteLength
          ) as ArrayBuffer;

          await logoStore.set(key, arrayBuffer, {
            metadata: { contentType: contentTypeFor(ext) },
          });

          savedBlobKey = key;
          // Disajikan lewat route server/routes/logo/[key].get.ts
          logoUrl = `/logo/${key}`;
        }
      }
    }

    const cleanupUploadedBlobOnError = async () => {
      if (savedBlobKey) {
        await logoStore.delete(savedBlobKey).catch(() => { });
      }
    };

    if (!shopName) {
      await cleanupUploadedBlobOnError();
      throw createError({ statusCode: 400, message: "Nama toko wajib diisi." });
    }
    if (shopName.length > MAX_SHOP_NAME_LEN) {
      await cleanupUploadedBlobOnError();
      throw createError({ statusCode: 400, message: `Nama toko tidak boleh melebihi ${MAX_SHOP_NAME_LEN} karakter.` });
    }
    if (description.length > MAX_DESCRIPTION_LEN) {
      await cleanupUploadedBlobOnError();
      throw createError({ statusCode: 400, message: `Deskripsi tidak boleh melebihi ${MAX_DESCRIPTION_LEN} karakter.` });
    }
    if (address.length > MAX_ADDRESS_LEN) {
      await cleanupUploadedBlobOnError();
      throw createError({ statusCode: 400, message: `Alamat tidak boleh melebihi ${MAX_ADDRESS_LEN} karakter.` });
    }

    if (phone) {
      if (phone.length > MAX_PHONE_LEN) {
        await cleanupUploadedBlobOnError();
        throw createError({ statusCode: 400, message: `Nomor telepon tidak boleh melebihi ${MAX_PHONE_LEN} karakter.` });
      }
      if (!PHONE_REGEX.test(phone)) {
        await cleanupUploadedBlobOnError();
        throw createError({ statusCode: 400, message: "Format nomor telepon tidak valid." });
      }

      // Cek apakah nomor telepon sudah digunakan oleh akun karyawan/user
      const existingUserPhone = await db.employee.findFirst({
        where: { phone: phone },
        select: { id: true },
      });

      if (existingUserPhone) {
        await cleanupUploadedBlobOnError();
        throw createError({
          statusCode: 400,
          message: "Nomor telepon ini sudah terdaftar sebagai nomor HP karyawan.",
        });
      }
    }

    const existing = await db.shopSettings.findUnique({ where: { id: "GLOBAL_SETTINGS" } });
    const oldLogoUrl = existing?.logoUrl || null;

    let updatedSettings;
    try {
      updatedSettings = await db.shopSettings.upsert({
        where: { id: "GLOBAL_SETTINGS" },
        update: {
          shopName,
          description,
          address,
          phone,
          ...(logoUrl !== undefined && { logoUrl }),
        },
        create: {
          id: "GLOBAL_SETTINGS",
          shopName,
          description,
          address,
          phone,
          logoUrl: logoUrl || null,
        },
      });
    } catch (err) {
      await cleanupUploadedBlobOnError();
      console.error("Gagal menyimpan pengaturan toko:", err);
      throw createError({ statusCode: 500, message: "Gagal menyimpan pengaturan. Silakan coba lagi." });
    }

    // Hapus logo lama dari Blob store setelah logo baru berhasil masuk ke DB
    if (logoUrl && oldLogoUrl && oldLogoUrl !== logoUrl && oldLogoUrl.startsWith("/logo/")) {
      const oldKey = oldLogoUrl.replace("/logo/", "");
      logoStore.delete(oldKey).catch(() => { });
    }

    return {
      success: true,
      message: "Pengaturan toko berhasil diperbarui.",
      data: toSnakeCaseResponse(updatedSettings),
    };
  }

  throw createError({ statusCode: 405, message: "Method Not Allowed" });
});