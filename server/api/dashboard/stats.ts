// server/api/dashboard/stats.ts
export default defineEventHandler(async (event) => {
  try {
    const totalProduk = await prisma.product.count()
    const totalKaryawan = await prisma.user.count()

    // Rentang hari ini
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const totalPesananHariIni = await prisma.order.count({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    })

    // Rentang kemarin (untuk hitung growth)
    const startOfYesterday = new Date(startOfDay)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const endOfYesterday = new Date(endOfDay)
    endOfYesterday.setDate(endOfYesterday.getDate() - 1)

    const totalPesananKemarin = await prisma.order.count({
      where: {
        createdAt: { gte: startOfYesterday, lte: endOfYesterday },
      },
    })

    // Hitung persentase growth
    let pesananGrowth = 0
    if (totalPesananKemarin > 0) {
      pesananGrowth = Math.round(((totalPesananHariIni - totalPesananKemarin) / totalPesananKemarin) * 100)
    } else if (totalPesananHariIni > 0) {
      pesananGrowth = 100
    }

    // Generate data 7 hari terakhir untuk grafik
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    const weeklyData = []

    for (let i = 6; i >= 0; i--) {
      const dStart = new Date()
      dStart.setDate(dStart.getDate() - i)
      dStart.setHours(0, 0, 0, 0)

      const dEnd = new Date(dStart)
      dEnd.setHours(23, 59, 59, 999)

      const count = await prisma.order.count({
        where: {
          createdAt: { gte: dStart, lte: dEnd },
        },
      })

      weeklyData.push({
        day: dayNames[dStart.getDay()],
        total: count,
      })
    }

    return {
      totalPesananHariIni,
      pesananGrowth,
      totalProduk,
      totalKaryawan,
      weeklyData,
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data statistik dashboard: ' + error.message,
    })
  }
})