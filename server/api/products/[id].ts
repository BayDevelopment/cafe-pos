import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'

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
  // Ambil hanya nama file dasar, mengabaikan struktur direktori berbahaya (misal: ../../.env)
  const filename = path.basename(relativePath)
  const fullPath = path.join(uploadDir, filename)

  // Pastikan file yang akan dihapus benar-benar berada di dalam folder public/uploads
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

  // ==========================================
  // 1. UPDATE PRODUK (PUT)
  // ==========================================
  if (method === 'PUT') {
    const files = await readMultipartFormData(event)
    if (!files) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }

    // Ambil data produk lama terlebih dahulu
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

    // Parse Form Data
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

    // Validasi & Simpan Gambar Baru (Jika Ada)
    if (uploadedFile) {
      // Validasi Ukuran (Maksimal 1 MB)
      const maxSizeInBytes = 1 * 1024 * 1024
      if (uploadedFile.data.length > maxSizeInBytes) {
        throw createError({ statusCode: 400, message: 'Ukuran gambar maksimal 1 MB' })
      }

      // Validasi Magic Bytes
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

      // Write file baru
      fs.writeFileSync(fullPath, uploadedFile.data)
      newImagePath = `/uploads/${randomFileName}`

      // Hapus file gambar lama secara aman jika ada gambar baru
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
  // 2. HAPUS PRODUK (DELETE)
  // ==========================================
  if (method === 'DELETE') {
    try {
      // Hapus record di database terlebih dahulu secara Atomic
      const deletedProduct = await prisma.product.delete({
        where: { id: productId },
      })

      // Jika berhasil dihapus di DB, baru hapus file gambarnya
      if (deletedProduct.image) {
        safeDeleteFile(deletedProduct.image)
      }

      return {
        success: true,
        message: 'Produk dan gambar berhasil dihapus',
        data: deletedProduct,
      }
    } catch (error: any) {
      // Tangani jika terjadi Double Click Hapus (Record P2025: Not Found)
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