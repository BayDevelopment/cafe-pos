// server/api/dashboard/stats.ts
export default defineEventHandler(async (event) => {
  try {
    // A. Hitung total seluruh produk
    const totalProduk = await prisma.product.count()

    // B. Hitung total karyawan (Sesuaikan nama model Prisma Anda, misal: prisma.user atau prisma.employee)
    const totalKaryawan = await prisma.user.count()

    // C. Hitung total pesanan hari ini (Rentang dari jam 00:00:00 sampai 23:59:59 hari ini)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const totalPesananHariIni = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    })

    // (Opsional) Logika untuk menghitung growth atau data mingguan jika diperlukan
    const pesananGrowth = 0 // Dapat dihitung dengan membandingkan hari kemarin jika ada

    return {
      totalPesananHariIni,
      pesananGrowth,
      totalProduk,
      totalKaryawan,
      weeklyData: [
        { day: 'Sen', total: 0 },
        { day: 'Sel', total: 0 },
        { day: 'Rab', total: 0 },
        { day: 'Kam', total: 0 },
        { day: 'Jum', total: 0 },
        { day: 'Sab', total: 0 },
        { day: 'Min', total: 0 },
      ]
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data statistik dashboard: ' + error.message,
    })
  }
})