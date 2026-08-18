// server/api/settings.ts
import { defineEventHandler, getMethod, readMultipartFormData, createError } from "h3";
import { db } from "../utils/db";
import { requireOwner } from "../utils/auth";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");
const MAX_LOGO_SIZE = 1 * 1024 * 1024; // 1 MB
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];

const MAX_SHOP_NAME_LEN = 255;
const MAX_DESCRIPTION_LEN = 300;
const MAX_ADDRESS_LEN = 500;
const MAX_PHONE_LEN = 20;

// Nomor telepon/WA Indonesia: boleh diawali +, angka, spasi, strip, kurung. 6-20 karakter.
const PHONE_REGEX = /^[0-9+()\-\s]{6,20}$/;


function detectImageType(buffer: Buffer): "jpg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

function extMatchesDetectedType(ext: string, detected: "jpg" | "png" | "webp"): boolean {
  if (detected === "jpg") return ext === ".jpg" || ext === ".jpeg";
  if (detected === "png") return ext === ".png";
  if (detected === "webp") return ext === ".webp";
  return false;
}


function toSnakeCaseResponse(settings: {
  shopName: string;
  description: string | null;
  address: string;
  phone: string;
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

  // Semua operasi di endpoint ini (baca & tulis) khusus Pemilik.
  // requireOwner melempar 401/403 secara eksplisit kalau tidak sesuai — tidak ada jalur silent-pass.
  await requireOwner(event);

  // GET — Ambil pengaturan
  if (method === "GET") {
    let settings = await db.shopSettings.findUnique({
      where: { id: "GLOBAL_SETTINGS" },
    });

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

    let shopName = "";
    let description = "";
    let address = "";
    let phone = "";
    let logoUrl: string | undefined = undefined;
    let savedFilePath: string | null = null;

    if (files) {
      for (const file of files) {
        if (file.name === "shop_name") {
          shopName = file.data.toString("utf8").trim();
        }
        if (file.name === "description") {
          description = file.data.toString("utf8").trim();
        }
        if (file.name === "address") {
          address = file.data.toString("utf8").trim();
        }
        if (file.name === "phone") {
          phone = file.data.toString("utf8").trim();
        }

        // --- VALIDASI FILE LOGO ---
        if (file.name === "logo" && file.filename && file.data.length > 0) {
          // A. Batas ukuran
          if (file.data.length > MAX_LOGO_SIZE) {
            throw createError({
              statusCode: 400,
              message: "Ukuran file logo terlalu besar. Batas maksimal adalah 1 MB.",
            });
          }

          // B. Ekstensi harus dalam whitelist
          const ext = path.extname(file.filename).toLowerCase();
          if (!ALLOWED_EXT.includes(ext)) {
            throw createError({
              statusCode: 400,
              message: "Format file tidak sah. Hanya file berformat .jpg, .jpeg, .png, atau .webp yang diizinkan.",
            });
          }

          // C. Isi file (magic bytes) harus benar-benar gambar, dan cocok dengan ekstensinya.
          //    Ini mencegah file berbahaya (mis. HTML/script) yang hanya "menyamar"
          //    lewat ekstensi gambar lalu tersimpan & bisa diakses publik di /uploads.
          const detected = detectImageType(file.data);
          if (!detected || !extMatchesDetectedType(ext, detected)) {
            throw createError({
              statusCode: 400,
              message: "Isi file tidak sesuai dengan format gambar yang diklaim.",
            });
          }

          await fs.mkdir(UPLOAD_DIR, { recursive: true });

          // Nama file acak & unik — hindari collision dan tebakan nama file.
          const fileName = `logo_${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
          const filePath = path.join(UPLOAD_DIR, fileName);

          // Pastikan hasil path akhir tetap di dalam UPLOAD_DIR (jaga-jaga path traversal).
          if (!filePath.startsWith(UPLOAD_DIR)) {
            throw createError({ statusCode: 400, message: "Nama file tidak valid." });
          }

          await fs.writeFile(filePath, file.data);
          savedFilePath = filePath;
          logoUrl = `/uploads/${fileName}`;
        }
      }
    }

    // --- VALIDASI INPUT TEKS ---
    const cleanupUploadedFileOnError = async () => {
      if (savedFilePath) {
        await fs.unlink(savedFilePath).catch(() => {});
      }
    };

    if (!shopName) {
      await cleanupUploadedFileOnError();
      throw createError({ statusCode: 400, message: "Nama toko wajib diisi." });
    }
    if (shopName.length > MAX_SHOP_NAME_LEN) {
      await cleanupUploadedFileOnError();
      throw createError({ statusCode: 400, message: `Nama toko tidak boleh melebihi ${MAX_SHOP_NAME_LEN} karakter.` });
    }

    if (description.length > MAX_DESCRIPTION_LEN) {
      await cleanupUploadedFileOnError();
      throw createError({ statusCode: 400, message: `Deskripsi tidak boleh melebihi ${MAX_DESCRIPTION_LEN} karakter.` });
    }

    if (address.length > MAX_ADDRESS_LEN) {
      await cleanupUploadedFileOnError();
      throw createError({ statusCode: 400, message: `Alamat tidak boleh melebihi ${MAX_ADDRESS_LEN} karakter.` });
    }

    if (phone) {
      if (phone.length > MAX_PHONE_LEN) {
        await cleanupUploadedFileOnError();
        throw createError({ statusCode: 400, message: `Nomor telepon tidak boleh melebihi ${MAX_PHONE_LEN} karakter.` });
      }
      if (!PHONE_REGEX.test(phone)) {
        await cleanupUploadedFileOnError();
        throw createError({ statusCode: 400, message: "Format nomor telepon tidak valid." });
      }
    }

    // Ambil settings lama dulu, supaya logo lama bisa dihapus setelah upsert berhasil.
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
      // Kalau simpan ke DB gagal, jangan tinggalkan file logo baru yang sudah terlanjur ditulis.
      await cleanupUploadedFileOnError();
      console.error("Gagal menyimpan pengaturan toko:", err);
      throw createError({ statusCode: 500, message: "Gagal menyimpan pengaturan. Silakan coba lagi." });
    }

    // Hapus logo lama HANYA setelah logo baru berhasil disimpan ke DB, dan hanya kalau memang diganti.
    if (logoUrl && oldLogoUrl && oldLogoUrl !== logoUrl) {
      const oldPath = path.resolve(process.cwd(), "public", oldLogoUrl.replace(/^\//, ""));
      if (oldPath.startsWith(UPLOAD_DIR)) {
        fs.unlink(oldPath).catch(() => {}); // best-effort, tidak menggagalkan response
      }
    }

    return {
      success: true,
      message: "Pengaturan toko berhasil diperbarui.",
      data: toSnakeCaseResponse(updatedSettings),
    };
  }

  throw createError({ statusCode: 405, message: "Method Not Allowed" });
});