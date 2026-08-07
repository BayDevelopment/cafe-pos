import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const method = event.node.req.method
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID tidak valid' })
  }
  const productId = Number(id)

  // 1. UPDATE PRODUK (PUT) - Mendukung ganti file gambar
  if (method === 'PUT') {
    const files = await readMultipartFormData(event)
    if (!files) {
      throw createError({ statusCode: 400, message: 'Invalid form data' })
    }

    let name = '', sku = '', price = 0, costPrice = 0, stock = 0, categoryId = 0, isActive = true
    let newImagePath: string | undefined = undefined

    // Ambil data produk lama untuk cek gambar lama
    const existingProduct = await prisma.product.findUnique({ where: { id: productId } })

    for (const file of files) {
      if (file.name === 'name') name = file.data.toString()
      if (file.name === 'sku') sku = file.data.toString()
      if (file.name === 'price') price = Number(file.data.toString())
      if (file.name === 'costPrice') costPrice = Number(file.data.toString())
      if (file.name === 'stock') stock = Number(file.data.toString())
      if (file.name === 'categoryId') categoryId = Number(file.data.toString())
      if (file.name === 'isActive') isActive = file.data.toString() === 'true'

      if (file.name === 'image' && file.filename && file.data.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }

        // Hapus gambar lama jika ada
        if (existingProduct?.image) {
          const oldPath = path.join(process.cwd(), 'public', existingProduct.image)
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        }

        const fileName = `${Date.now()}-${file.filename.replace(/\s+/g, '_')}`
        fs.writeFileSync(path.join(uploadDir, fileName), file.data)
        newImagePath = `/uploads/${fileName}`
      }
    }

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
        ...(newImagePath !== undefined && { image: newImagePath })
      }
    })

    return { success: true, data: updatedProduct }
  }

  // 2. HAPUS PRODUK & FILE FISIK (DELETE)
  if (method === 'DELETE') {
    const product = await prisma.product.findUnique({ where: { id: productId } })

    if (!product) {
      throw createError({ statusCode: 404, message: 'Produk tidak ditemukan' })
    }

    if (product.image) {
      const filePath = path.join(process.cwd(), 'public', product.image)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch (err) {
          console.error('Gagal hapus file fisik:', err)
        }
      }
    }

    const deletedProduct = await prisma.product.delete({ where: { id: productId } })

    return { success: true, data: deletedProduct, message: 'Produk dan gambar berhasil dihapus' }
  }
})