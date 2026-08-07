// server/api/categories/index.ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const validNamePattern = /^[a-zA-Z0-9\s&\-/()]+$/

  // GET: Fetch Data Kategori dengan Search & Pagination
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

  // POST: Tambah Kategori Baru
  if (method === 'POST') {
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
})