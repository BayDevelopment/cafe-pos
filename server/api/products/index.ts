import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'

// Fungsi Helper sederhaana untuk cek Magic Bytes (Signature File) tanpa lib luar
function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null
  const hex = buffer.toString('hex', 0, 4).toUpperCase()

  // PNG Magic Bytes: 89 50 4E 47
  if (hex === '89504E47') return 'image/png'

  // JPEG Magic Bytes: FF D8 FF
  if (hex.startsWith('FFD8FF')) return 'image/jpeg'

  return null
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  // 1. GET Products (Tetap sama)
  if (method === 'GET') {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
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

  // 2. POST Product
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

    for (const file of files) {
      const fieldName = file.name
      const value = file.data.toString('utf-8')

      if (fieldName === 'name') name = value.trim()
      if (fieldName === 'sku') sku = value.trim()
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

    // Validasi Dasar Input Teks
    if (!categoryId || categoryId === 0) {
      throw createError({ statusCode: 400, message: 'Kategori wajib dipilih.' })
    }
    if (!name) {
      throw createError({ statusCode: 400, message: 'Nama produk wajib diisi.' })
    }
    if (price <= 0) {
      throw createError({ statusCode: 400, message: 'Harga jual wajib lebih dari 0.' })
    }

    // D. Proses & Validasi File Gambar (KEAMANAN KETAT)
    let imagePath: string | null = null

    if (uploadedFile) {
      // 1. Validasi Ukuran File (Maksimal 1 MB)
      const maxSizeInBytes = 1 * 1024 * 1024
      if (uploadedFile.data.length > maxSizeInBytes) {
        throw createError({
          statusCode: 400,
          message: 'Ukuran gambar terlalu besar. Maksimal 1 MB.',
        })
      }

      // 2. CEK MAGIC BYTES (MIME TYPE ASLI BERDASARKAN ISI FILE)
      const detectedMime = getMimeTypeFromBuffer(uploadedFile.data)
      const allowedMimes = ['image/png', 'image/jpeg']

      if (!detectedMime || !allowedMimes.includes(detectedMime)) {
        throw createError({
          statusCode: 400,
          message: 'File yang diunggah bukan gambar valid (Hanya PNG & JPG/JPEG asli yang diizinkan).',
        })
      }

      // 3. TENTUKAN EKSTENSI BERDASARKAN MIME TYPE ASLI (Bukan dari Nama File Asli Client!)
      const safeExtension = detectedMime === 'image/png' ? '.png' : '.jpg'

      // 4. CEGAH PATH TRAVERSAL: Buat nama file acak secara total (Gunakan Random UUID / Hex)
      const randomFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fullPath = path.join(uploadDir, randomFileName)

      // Simpan File Aman
      fs.writeFileSync(fullPath, uploadedFile.data)
      imagePath = `/uploads/${randomFileName}`
    }

    // E. Simpan ke Database
    try {
      const newProduct = await prisma.product.create({
        data: {
          name: name,
          sku: sku ? sku : null,
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
    } catch (error: any) {
      // Jika terjadi error unik / duplikat dari Database
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw createError({
          statusCode: 400,
          message: 'Produk atau SKU ini sudah terdaftar di database.',
        })
      }
      throw error
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})