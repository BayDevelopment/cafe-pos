// server/api/products/index.ts
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null
  const hex = buffer.toString('hex', 0, 4).toUpperCase()
  if (hex === '89504E47') return 'image/png'
  if (hex.startsWith('FFD8FF')) return 'image/jpeg'
  return null
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method

  // 1. GET Products (Dapat diakses Kasir & Pemilik)
  if (method === 'GET') {
    const query = getQuery(event)
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 10
    const skip = (page - 1) * limit

    // Ambil parameter filter dari frontend
    const search = query.search ? String(query.search).trim() : ''
    const categoryId = query.category ? Number(query.category) : null
    
    // Konversi filter status string ('true'/'false') ke boolean
    let isActive: boolean | undefined = undefined
    if (query.status === 'true') isActive = true
    if (query.status === 'false') isActive = false

    // Susun kondisi 'where' secara dinamis untuk Prisma
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const [products, totalItems] = await Promise.all([
      prisma.product.findMany({
        where, // Masukkan kondisi filter di sini
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit,
      }),
      prisma.product.count({ where }), // Hitung total berdasarkan filter yang sama
    ])

    return {
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    }
  }

  // 2. POST Product (Hanya untuk ROLE PEMILIK)
  if (method === 'POST') {
    // Ambil token JWT dari cookie 'auth_token'
    const token = getCookie(event, 'auth_token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Akses ditolak. Anda belum login atau sesi telah habis.',
      })
    }

    try {
      // Verifikasi token (sesuaikan secret key dengan backend login Anda)
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-kedaikopi'
      const decoded = jwt.verify(token, jwtSecret) as any

      // Cek apakah rolenya benar-benar PEMILIK
      if (String(decoded.role || '').toUpperCase() !== 'PEMILIK') {
        throw createError({
          statusCode: 403,
          message: 'Akses ditolak. Hanya PEMILIK yang diizinkan menambah produk.',
        })
      }
    } catch (error) {
      throw createError({
        statusCode: 401,
        message: 'Sesi login tidak valid. Silakan login kembali.',
      })
    }

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

    if (!categoryId || categoryId === 0) {
      throw createError({ statusCode: 400, message: 'Kategori wajib dipilih.' })
    }
    if (!name) {
      throw createError({ statusCode: 400, message: 'Nama produk wajib diisi.' })
    }
    if (price <= 0) {
      throw createError({ statusCode: 400, message: 'Harga jual wajib lebih dari 0.' })
    }

    let imagePath: string | null = null

    if (uploadedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (uploadedFile.data.length > maxSizeInBytes) {
        throw createError({
          statusCode: 400,
          message: 'Ukuran gambar terlalu besar. Maksimal 1 MB.',
        })
      }

      const detectedMime = getMimeTypeFromBuffer(uploadedFile.data)
      const allowedMimes = ['image/png', 'image/jpeg']

      if (!detectedMime || !allowedMimes.includes(detectedMime)) {
        throw createError({
          statusCode: 400,
          message: 'File yang diunggah bukan gambar valid (Hanya PNG & JPG/JPEG asli yang diizinkan).',
        })
      }

      const safeExtension = detectedMime === 'image/png' ? '.png' : '.jpg'
      const randomFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const fullPath = path.join(uploadDir, randomFileName)
      fs.writeFileSync(fullPath, uploadedFile.data)
      imagePath = `/uploads/${randomFileName}`
    }

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