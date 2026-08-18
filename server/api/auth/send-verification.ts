import { defineEventHandler, createError } from "h3";
import { db } from "../../utils/db";
import { requireUser } from "../../utils/auth";
import crypto from "node:crypto";

// 1. Tambahkan import sendEmail dari file mailer.ts kamu
import { sendEmail } from "../../utils/mailer"; 

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam

export default defineEventHandler(async (event) => {
    // requireUser: siapa saja yang login (KASIR atau PEMILIK) boleh minta verifikasi emailnya sendiri.
    const authUser = await requireUser(event);

    const user = await db.user.findUnique({ where: { id: authUser.id } });
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: "User tidak ditemukan." });
    }

    if (user.emailVerifiedAt) {
        throw createError({ statusCode: 400, statusMessage: "Email sudah terverifikasi." });
    }

    // Ambil data toko (nama + logo) untuk ditampilkan di email
    const shop = await db.shopSettings.findFirst();
    const shopName = shop?.shopName ?? "Kedai Kopi POS";
    const logoUrl = shop?.logoUrl ?? null;

    // Tandai token-token lama milik user ini sebagai "dipakai", supaya tidak ada
    // beberapa token aktif sekaligus (token lama otomatis tidak berlaku lagi).
    await db.verificationToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await db.verificationToken.create({
        data: { userId: user.id, token, expiresAt },
    });

    const verifyUrl = `${process.env.APP_URL}/verifikasi-email?token=${token}`;

    // 2. Buat template HTML untuk isi pesannya (dengan logo & nama kedai)
    const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1c1410; border: 1px solid #eee; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 24px;">
                ${logoUrl
                    ? `<img src="${logoUrl}" alt="${shopName}" style="max-width: 120px; max-height: 120px; border-radius: 8px; margin-bottom: 12px;" />`
                    : ""
                }
                <h1 style="color: #1c1410; font-size: 20px; margin: 0;">${shopName}</h1>
            </div>

            <h2 style="color: #c9793f;">Halo ${user.name},</h2>
            <p>Terima kasih telah menggunakan sistem POS ${shopName}. Untuk menjaga keamanan akun kamu, silakan verifikasi alamat email dengan mengklik tombol di bawah ini:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; padding: 14px 28px; background-color: #c9793f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Verifikasi Email Sekarang
                </a>
            </div>
            <p style="font-size: 14px; color: #666;">
                <i>Catatan: Link verifikasi ini hanya berlaku selama 1 jam.</i>
            </p>
            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser kamu: <br>
                <a href="${verifyUrl}" style="color: #c9793f; word-break: break-all;">${verifyUrl}</a>
            </p>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 24px;">
                &copy; ${new Date().getFullYear()} ${shopName}. Semua hak dilindungi.
            </p>
        </div>
    `;

    // 3. Eksekusi pengiriman email menggunakan try-catch
    try {
        await sendEmail(
            user.email, 
            `Verifikasi Akun ${shopName}`, 
            emailHtml
        );
        console.log(`[Berhasil] Email verifikasi terkirim ke ${user.email}`);
    } catch (error) {
        console.error(`[Error] Gagal mengirim email ke ${user.email}:`, error);
        // Gagalkan request jika email gagal dikirim (misal koneksi SMTP terputus)
        throw createError({ 
            statusCode: 500, 
            statusMessage: "Gagal mengirim email verifikasi. Pastikan konfigurasi SMTP di file .env sudah benar." 
        });
    }

    return { success: true, message: "Email verifikasi telah dikirim." };
});