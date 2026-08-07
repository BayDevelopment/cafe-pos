import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  // ==========================================
  // 1. GET: Mengambil data produk dengan Pagination
  // ==========================================
  if (method === 'GET') {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    // Ambil data produk dan total keseluruhan data secara bersamaan
    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      prisma.product.count(),
    ])

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    }
  }

  // ==========================================
  // 2. POST: Menambah produk baru + Upload File
  // ==========================================
  if (method === 'POST') {
    const files = await readMultipartFormData(event)
    if (!files) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }

    let name = ''
    let sku = ''
    let price = 0
    let costPrice = 0
    let stock = 0
    let categoryId = 0
    let isActive = true
    let uploadedFile: { filename: string; data: Buffer } | null = null

    // A. Parsing data dari FormData
    for (const file of files) {
      const fieldName = file.name
      const value = file.data.toString()

      if (fieldName === 'name') name = value
      if (fieldName === 'sku') sku = value
      if (fieldName === 'price') price = Number(value)
      if (fieldName === 'costPrice') costPrice = value ? Number(value) : 0
      if (fieldName === 'stock') stock = Number(value)
      if (fieldName === 'categoryId') categoryId = Number(value)
      if (fieldName === 'isActive') isActive = value === 'true'

      if (fieldName === 'image' && file.filename && file.data.length > 0) {
        uploadedFile = {
          filename: file.filename,
          data: file.data,
        }
      }
    }

    // B. Validasi Server-Side Teks
    const MAX_NAME_LENGTH = 100

    if (!categoryId || categoryId === 0) {
      throw createError({ statusCode: 400, message: 'Kategori wajib dipilih.' })
    }

    if (!name || name.trim() === '') {
      throw createError({ statusCode: 400, message: 'Nama produk wajib diisi.' })
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `Nama produk terlalu panjang. Maksimal ${MAX_NAME_LENGTH} karakter.`,
      })
    }

    if (price <= 0) {
      throw createError({ statusCode: 400, message: 'Harga jual wajib diisi dan harus lebih dari 0.' })
    }

    if (stock < 0) {
      throw createError({ statusCode: 400, message: 'Stok tidak boleh bernilai negatif.' })
    }

    // C. Cek Duplikat Produk (Berdasarkan Nama dalam 5 detik terakhir)
    const recentProduct = await prisma.product.findFirst({
      where: {
        name: name.trim(),
        createdAt: {
          gte: new Date(Date.now() - 5000), // 5 detik ke belakang
        },
      },
    })

    if (recentProduct) {
      throw createError({
        statusCode: 400,
        message: 'Produk yang sama baru saja ditambahkan. Harap tunggu sebentar.',
      })
    }

    // D. Proses & Validasi File Gambar (Jika Diunggah)
    let imagePath: string | null = null
    if (uploadedFile) {
      const originalName = uploadedFile.filename
      const fileExtension = path.extname(originalName).toLowerCase()

      // Validasi Ekstensi Gambar
      if (!['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
        throw createError({
          statusCode: 400,
          message: 'Format gambar ditolak. Hanya file berformat PNG dan JPG/JPEG yang diizinkan.',
        })
      }

      // Validasi Ukuran File (Maksimal 1 MB)
      const maxSizeInBytes = 1 * 1024 * 1024
      if (uploadedFile.data.length > maxSizeInBytes) {
        throw createError({
          statusCode: 400,
          message: 'Ukuran gambar terlalu besar. Maksimal ukuran file adalah 1 MB.',
        })
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fileName = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`
      const fullPath = path.join(uploadDir, fileName)

      fs.writeFileSync(fullPath, uploadedFile.data)
      imagePath = `/uploads/${fileName}`
    }

    // E. Simpan ke Database
    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku ? sku.trim() : null,
        image: imagePath,
        price: price,
        costPrice: costPrice > 0 ? costPrice : null,
        stock: stock,
        categoryId: categoryId,
        isActive: isActive,
      },
      include: {
        category: true,
      },
    })

    return {
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: newProduct,
    }
  }

  // Jika method lain tidak didukung
  throw createError({ statusCode: 405, message: 'Method not allowed' })
})