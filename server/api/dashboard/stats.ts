// server/api/dashboard/stats.ts
export default defineEventHandler(async (event) => {
  try {
    // 1. Ambil data user yang sedang login (pastikan middleware auth Anda menyimpannya di event.context.user)
    const user = event.context.user

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized: Silakan login terlebih dahulu.',
      })
    }

    // 2. Hitung statistik dasar (dapat diakses Kasir & Pemilik)
    const totalProduk = await prisma.product.count({
      where: { isActive: true },
    })

    // Menghitung total karyawan aktif dari tabel Employee
    const totalKaryawan = await prisma.employee.count({
      where: { status: 'AKTIF' },
    })

    // Rentang hari ini
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    // Hitung pesanan hari ini yang berstatus PAID
    const totalPesananHariIni = await prisma.order.count({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'PAID',
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
        status: 'PAID',
      },
    })

    // Hitung persentase growth
    let pesananGrowth = 0
    if (totalPesananKemarin > 0) {
      pesananGrowth = Math.round(((totalPesananHariIni - totalPesananKemarin) / totalPesananKemarin) * 100)
    } else if (totalPesananHariIni > 0) {
      pesananGrowth = 100
    }

    // Generate data 7 hari terakhir untuk grafik (hanya pesanan PAID)
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
          status: 'PAID',
        },
      })

      weeklyData.push({
        day: dayNames[dStart.getDay()],
        total: count,
      })
    }

    // 3. Objek data dasar untuk Kasir
    const baseStats: any = {
      totalPesananHariIni,
      pesananGrowth,
      totalProduk,
      totalKaryawan,
      weeklyData,
    }

    // 4. KHUSUS ROLE PEMILIK: Tambahkan data finansial & stok kritis
    if (user.role === 'PEMILIK') {
      const aggregateOmzet = await prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: 'PAID',
        },
        _sum: {
          totalAmount: true, // Sesuai dengan kolom di schema.prisma
        },
      })

      const stokKritis = await prisma.product.count({
        where: {
          stock: { lte: 5 }, // Produk dengan sisa stok <= 5
          isActive: true,
        },
      })

      // Konversi Prisma Decimal ke tipe number agar aman dikirim ke frontend
      baseStats.totalOmzet = Number(aggregateOmzet._sum.totalAmount || 0)
      baseStats.stokKritis = stokKritis
      baseStats.totalTransaksi = totalPesananHariIni
    }

    return baseStats

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Gagal mengambil data statistik dashboard: ' + error.message,
    })
  }
})