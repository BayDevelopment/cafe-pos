// server/api/auth/login.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { db } from '../../utils/db'
import { rateLimitByIpAndIdentifier, resetRateLimitByIpAndIdentifier } from '../../utils/rateLimiter'

const MAX_EMAIL_LEN = 255
const MAX_PASSWORD_LEN = 200

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  if (method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const body = await readBody(event)
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

  // Rate limit: maksimal 5 percobaan login per menit, per kombinasi IP + email.
  // Dicek SEBELUM query ke database, supaya percobaan yang sudah kena limit
  // tidak ikut membebani DB sama sekali.
  rateLimitByIpAndIdentifier(event, cleanEmail, 'login', { maxAttempts: 5, windowMs: 60 * 1000 })

  // Pesan error untuk SEMUA kegagalan login (email tidak ada, password salah, akun nonaktif)
  // sengaja disamakan, supaya tidak membocorkan email mana saja yang terdaftar di sistem
  // (mencegah user enumeration).
  const GENERIC_AUTH_ERROR = 'Email atau kata sandi salah.'

  try {
    // 1. Cari user berdasarkan email
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
    })

    if (!user) {
      throw createError({ statusCode: 401, message: GENERIC_AUTH_ERROR })
    }

    // 2. Cek kecocokan password — HANYA lewat bcrypt, tidak ada fallback plaintext.
    //    Kalau password di DB tidak berformat hash bcrypt, anggap kredensial salah
    //    (jangan pernah diam-diam menerima password mentah).
    const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')
    const isPasswordValid = isBcryptHash ? await bcrypt.compare(cleanPassword, user.password) : false

    if (!isPasswordValid) {
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
      { expiresIn: '1d' }
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
    resetRateLimitByIpAndIdentifier(event, cleanEmail, 'login')

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