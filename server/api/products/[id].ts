// server/api/products/[id].ts
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

// Helper 1: Cek Magic Bytes (MIME Type Asli dari Isi Buffer)
function getMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 4) return null
  const hex = buffer.toString('hex', 0, 4).toUpperCase()

  if (hex === '89504E47') return 'image/png'
  if (hex.startsWith('FFD8FF')) return 'image/jpeg'

  return null
}

// Helper 2: Mencegah Path Traversal Saat Hapus File Fisik
function safeDeleteFile(relativePath: string) {
  if (!relativePath || typeof relativePath !== 'string') return

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filename = path.basename(relativePath)
  const fullPath = path.join(uploadDir, filename)

  if (fullPath.startsWith(uploadDir) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath)
    } catch (err) {
      console.error('Gagal menghapus file fisik:', err)
    }
  }
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const idRaw = event.context.params?.id

  // 1. Validasi ID Akses
  const productId = Number(idRaw)
  if (!idRaw || isNaN(productId) || productId <= 0) {
    throw createError({ statusCode: 400, message: 'ID produk tidak valid' })
  }

  // 2. Proteksi Role: Hanya PEMILIK yang diizinkan melakukan EDIT (PUT) atau HAPUS (DELETE)
  if (method === 'PUT' || method === 'DELETE') {
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
          message: 'Akses ditolak. Hanya PEMILIK yang diizinkan mengubah atau menghapus produk.',
        })
      }
    } catch (error) {
      throw createError({
        statusCode: 401,
        message: 'Sesi login tidak valid. Silakan login kembali.',
      })
    }
  }

  // ==========================================
  // 3. UPDATE PRODUK (PUT) - HANYA PEMILIK
  // ==========================================
  if (method === 'PUT') {
    const files = await readMultipartFormData(event)
    if (!files) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!existingProduct) {
      throw createError({ statusCode: 404, message: 'Produk tidak ditemukan' })
    }

    let name = existingProduct.name
    let sku = existingProduct.sku
    let price = existingProduct.price
    let costPrice = existingProduct.costPrice
    let stock = existingProduct.stock
    let categoryId = existingProduct.categoryId
    let isActive = existingProduct.isActive
    let newImagePath: string | undefined = undefined

    let uploadedFile: { filename: string; data: Buffer } | null = null

    for (const file of files) {
      const fieldName = file.name
      const value = file.data.toString('utf-8')

      if (fieldName === 'name' && value.trim()) name = value.trim()
      if (fieldName === 'sku') sku = value.trim() ? value.trim() : null
      if (fieldName === 'price' && !isNaN(Number(value))) price = Number(value)
      if (fieldName === 'costPrice') costPrice = Number(value) || null
      if (fieldName === 'stock' && !isNaN(Number(value))) stock = Number(value)
      if (fieldName === 'categoryId' && !isNaN(Number(value))) categoryId = Number(value)
      if (fieldName === 'isActive') isActive = value === 'true'

      if (fieldName === 'image' && file.filename && file.data.length > 0) {
        uploadedFile = {
          filename: file.filename,
          data: file.data,
        }
      }
    }

    if (uploadedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (uploadedFile.data.length > maxSizeInBytes) {
        throw createError({ statusCode: 400, message: 'Ukuran gambar maksimal 1 MB' })
      }

      const detectedMime = getMimeTypeFromBuffer(uploadedFile.data)
      if (!detectedMime || !['image/png', 'image/jpeg'].includes(detectedMime)) {
        throw createError({
          statusCode: 400,
          message: 'Format gambar ditolak. Hanya PNG dan JPG/JPEG asli yang diizinkan.',
        })
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const safeExtension = detectedMime === 'image/png' ? '.png' : '.jpg'
      const randomFileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExtension}`
      const fullPath = path.join(uploadDir, randomFileName)

      fs.writeFileSync(fullPath, uploadedFile.data)
      newImagePath = `/uploads/${randomFileName}`

      if (existingProduct.image) {
        safeDeleteFile(existingProduct.image)
      }
    }

    try {
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          sku,
          price,
          costPrice,
          stock,
          categoryId,
          isActive,
          ...(newImagePath !== undefined && { image: newImagePath }),
        },
      })

      return {
        success: true,
        message: 'Produk berhasil diperbarui',
        data: updatedProduct,
      }
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw createError({ statusCode: 400, message: 'SKU produk sudah digunakan.' })
      }
      throw error
    }
  }

  // ==========================================
  // 4. HAPUS PRODUK (DELETE) - HANYA PEMILIK
  // ==========================================
  if (method === 'DELETE') {
    try {
      const deletedProduct = await prisma.product.delete({
        where: { id: productId },
      })

      if (deletedProduct.image) {
        safeDeleteFile(deletedProduct.image)
      }

      return {
        success: true,
        message: 'Produk dan gambar berhasil dihapus',
        data: deletedProduct,
      }
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw createError({
          statusCode: 404,
          message: 'Produk sudah dihapus atau tidak ditemukan.',
        })
      }
      throw error
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})