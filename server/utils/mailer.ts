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
    secure: port === 465,
    auth: { user, pass },
  });
}

const globalForMailer = globalThis as unknown as { mailerTransporter?: nodemailer.Transporter };
export const mailer = globalForMailer.mailerTransporter || createTransporter();
if (process.env.NODE_ENV !== "production") {
  globalForMailer.mailerTransporter = mailer;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  // Validasi dasar untuk cegah header injection / typo yang bikin request nyasar.
  if (!EMAIL_REGEX.test(to)) {
    throw new Error(`Alamat email tujuan tidak valid: ${to}`);
  }
  if (/[\r\n]/.test(subject)) {
    throw new Error("Subject email mengandung karakter tidak valid.");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await mailer.sendMail({ from, to, subject, html });
  } catch (err) {
    console.error(`[mailer] Gagal mengirim email ke ${to}:`, err);
    // Lempar ulang supaya caller yang tahu apakah email ini kritikal (misal reset password)
    // atau boleh diabaikan (misal notifikasi non-esensial).
    throw err;
  }
}