// Contoh di server/api/products.ts
import { db } from '../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await db.product.findMany({
      include: { category: true }
    })
  }
})