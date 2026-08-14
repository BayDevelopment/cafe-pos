// server/utils/mailer.ts
//
// Koneksi SMTP via Nodemailer. Pola singleton di globalThis sama seperti prisma.ts,
// supaya tidak bikin koneksi SMTP baru berulang-ulang setiap hot-reload di dev mode.

import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "FATAL: Konfigurasi SMTP tidak lengkap. Pastikan SMTP_HOST, SMTP_USER, dan SMTP_PASS sudah diset di .env"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true untuk port 465 (SSL langsung), false untuk 587 (STARTTLS)
    auth: { user, pass },
  });
}

const globalForMailer = globalThis as unknown as { mailerTransporter?: nodemailer.Transporter };

export const mailer = globalForMailer.mailerTransporter || createTransporter();

if (process.env.NODE_ENV !== "production") {
  globalForMailer.mailerTransporter = mailer;
}

/**
 * Kirim email generik. Melempar error kalau gagal — pemanggil (endpoint) yang
 * memutuskan apakah kegagalan ini boleh terlihat oleh user atau harus disembunyikan
 * (mis. forgot-password sengaja menyembunyikan kegagalan kirim email dari client).
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await mailer.sendMail({ from, to, subject, html });
}