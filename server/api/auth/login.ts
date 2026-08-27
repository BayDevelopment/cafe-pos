// server/api/auth/login.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '../../utils/db'
import { rateLimitByIpAndIdentifier, resetRateLimitByIpAndIdentifier } from '../../utils/rateLimiter'

const MAX_EMAIL_LEN = 255
const MAX_PASSWORD_LEN = 200

const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8vFj/RJhmXvV+9pXCXZ9r5t5Y2b1Fy'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  let body: any
  try {
    body = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, message: 'Body request tidak valid.' })
  }

  const { email, password } = body || {}

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email dan kata sandi wajib diisi.',
    })
  }

  const cleanEmail = String(email).trim().toLowerCase()
  const cleanPassword = String(password)

  if (cleanEmail.length > MAX_EMAIL_LEN || cleanPassword.length > MAX_PASSWORD_LEN) {
    throw createError({ statusCode: 400, message: 'Email atau kata sandi tidak valid.' })
  }

  // 👉 PENTING: wajib di-await, checkRateLimit sekarang async (Redis call).
  // Tanpa await, request langsung lanjut tanpa nunggu hasil pengecekan limit,
  // jadi proteksi brute-force ini efektif tidak berjalan.
  await rateLimitByIpAndIdentifier(event, cleanEmail, 'login', { maxAttempts: 5, windowMs: 60 * 1000 })

  const GENERIC_AUTH_ERROR = 'Email atau kata sandi salah.'

  try {
    // 1. Cari user berdasarkan email
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    })

    const isBcryptHash = user
      ? user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')
      : false

    const isPasswordValid = await bcrypt.compare(
      cleanPassword,
      isBcryptHash ? user!.password : DUMMY_HASH
    )

    if (!user || !isPasswordValid) {
      throw createError({ statusCode: 401, message: GENERIC_AUTH_ERROR })
    }

    // 3. Tolak akun yang sudah dinonaktifkan
    if (!user.isActive) {
      throw createError({ statusCode: 401, message: GENERIC_AUTH_ERROR })
    }

    // 4. Buat JWT Token — tanpa fallback secret, fail closed kalau env belum diset.
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw createError({ statusCode: 500, message: 'Konfigurasi server tidak lengkap.' })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '1d', algorithm: 'HS256' }
    )

    // 5. Simpan Cookie Token
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    // Login berhasil — bersihkan counter rate limit supaya tidak ikut menghitung ke sesi berikutnya.
    // 👉 PENTING: juga wajib di-await.
    await resetRateLimitByIpAndIdentifier(event, cleanEmail, 'login')

    return {
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      message: 'Terjadi kesalahan pada server saat login.',
    })
  }
})