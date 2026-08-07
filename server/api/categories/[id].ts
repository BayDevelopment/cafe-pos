// server/api/categories/[id].ts
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

  // PUT: Update Kategori
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

  // DELETE: Hapus Kategori
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
})