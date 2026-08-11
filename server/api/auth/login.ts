// server/api/auth/login.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt' // <-- LAKUKAN IMPORT STATIC DI SINI

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
  const cleanPassword = String(password).trim()

  try {
    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    // Jika user tidak ditemukan
    if (!user) {
      throw createError({
        statusCode: 401,
        message: `Email "${cleanEmail}" tidak ditemukan di DB. Pastikan email menggunakan karakter '@'.`,
      })
    }

    // 2. Cek kecocokan password menggunakan static bcrypt
    let isPasswordValid = false

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Bandingkan hash langsung karena bcrypt sudah di-import di atas
      isPasswordValid = await bcrypt.compare(cleanPassword, user.password)
    } else {
      // Jika di masa depan ada password plain text
      isPasswordValid = user.password === cleanPassword
    }

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: `Kata sandi tidak cocok.`,
      })
    }

    // 3. Buat JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-kedaikopi'
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '1d' }
    )

    // 4. Simpan Cookie Token
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return {
      success: true,
      message: 'Login berhasil',
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: error.message || 'Terjadi kesalahan pada server saat login.',
    })
  }
})