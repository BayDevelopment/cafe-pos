// server/api/categories/index.ts
import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const validNamePattern = /^[a-zA-Z0-9\s&\-/()]+$/

  // GET: Fetch Data Kategori dengan Search & Pagination (Bisa diakses Kasir & Pemilik)
  if (method === 'GET') {
    try {
      const query = getQuery(event)
      
      const search = typeof query.search === 'string' ? query.search.trim() : ''
      const page = Math.max(1, parseInt(query.page as string) || 1)
      const limit = Math.max(1, Math.min(100, parseInt(query.limit as string) || 10)) // Default 10 data per halaman
      const skip = (page - 1) * limit

      // Kondisi Filter Search
      const whereCondition = search
        ? {
            name: {
              contains: search,
              mode: 'insensitive' as const // Search case-insensitive
            }
          }
        : {}

      // Ambil Total Data & Data per Halaman secara paralel
      const [total, categories] = await Promise.all([
        prisma.category.count({ where: whereCondition }),
        prisma.category.findMany({
          where: whereCondition,
          skip,
          take: limit,
          include: {
            _count: {
              select: { products: true }
            }
          },
          orderBy: { name: 'asc' }
        })
      ])

      const totalPages = Math.ceil(total / limit)

      return {
        success: true,
        data: categories,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gagal mengambil data kategori: ' + error.message
      })
    }
  }

  // POST: Tambah Kategori Baru - HANYA PEMILIK
  if (method === 'POST') {
    // Ambil token JWT dari cookie 'auth_token'
    const token = getCookie(event, 'auth_token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Akses ditolak. Anda belum login atau sesi telah habis.',
      })
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-kedaikopi'
      const decoded = jwt.verify(token, jwtSecret) as any

      // Pastikan role yang masuk adalah PEMILIK
      if (String(decoded.role || '').toUpperCase() !== 'PEMILIK') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Akses ditolak. Hanya Pemilik yang diizinkan menambah kategori.',
        })
      }
    } catch (error: any) {
      if (error.statusCode) throw error // Lempar kembali error kustom di atas
      throw createError({
        statusCode: 401,
        statusMessage: 'Sesi login tidak valid. Silakan login kembali.',
      })
    }

    const body = await readBody(event)
    const trimmedName = typeof body.name === 'string' ? body.name.trim() : ''

    if (!trimmedName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama kategori wajib diisi.'
      })
    }

    if (!validNamePattern.test(trimmedName)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama kategori hanya boleh berisi huruf, angka, spasi, dan simbol (&, -, /, ()).'
      })
    }

    try {
      const newCategory = await prisma.category.create({
        data: { name: trimmedName }
      })
      return { success: true, data: newCategory }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gagal menambah kategori: ' + error.message
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})