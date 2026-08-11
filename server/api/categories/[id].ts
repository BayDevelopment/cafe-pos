// server/api/categories/[id].ts
import jwt from 'jsonwebtoken'
import { getCookie } from 'h3'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const idParam = getRouterParam(event, 'id')
  const categoryId = Number(idParam)

  if (!categoryId || isNaN(categoryId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Kategori tidak valid.'
    })
  }

  // Proteksi Role: Hanya PEMILIK yang diizinkan melakukan EDIT (PUT) atau HAPUS (DELETE)
  if (method === 'PUT' || method === 'DELETE') {
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

      if (String(decoded.role || '').toUpperCase() !== 'PEMILIK') {
        throw createError({
          statusCode: 403,
          statusMessage: 'Akses ditolak. Hanya Pemilik yang diizinkan mengubah atau menghapus kategori.',
        })
      }
    } catch (error: any) {
      if (error.statusCode) throw error
      throw createError({
        statusCode: 401,
        statusMessage: 'Sesi login tidak valid. Silakan login kembali.',
      })
    }
  }

  // PUT: Update Kategori - HANYA PEMILIK
  if (method === 'PUT') {
    const body = await readBody(event)

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Nama kategori wajib diisi.'
      })
    }

    try {
      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { name: body.name.trim() }
      })
      return { success: true, data: updatedCategory }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gagal memperbarui kategori: ' + error.message
      })
    }
  }

  // DELETE: Hapus Kategori - HANYA PEMILIK
  if (method === 'DELETE') {
    try {
      await prisma.category.delete({
        where: { id: categoryId }
      })
      return { success: true, message: 'Kategori berhasil dihapus' }
    } catch (error: any) {
      // Menangani restriction dari Prisma jika kategori masih terhubung dengan produk
      if (error.code === 'P2003') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Kategori tidak dapat dihapus karena masih digunakan oleh beberapa produk.'
        })
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Gagal menghapus kategori: ' + error.message
      })
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  })
})