<!-- app/pages/kasir/laporan.vue -->
<template>
  <div class="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee] font-semibold">ANALISIS</span>
          <span class="mono label-xs text-[#8A7A68]">LAPORAN PENJUALAN</span>
        </div>
        <h1 class="display text-2xl md:text-3xl text-[#2b1b12] font-bold tracking-tight">Laporan Keuangan & Omset</h1>
        <p class="mono text-xs text-[#8A7A68] mt-1">Analisis tren penjualan, pendapatan, dan statistik menu favorit.</p>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="flex items-center gap-2 w-full md:w-auto">
        <button type="button"
          class="btn-stamp mono w-full md:w-auto px-5 py-2.5 text-xs flex items-center justify-center gap-2"
          @click="exportExcelReport">
          <LucideFileSpreadsheet class="w-4 h-4" />
          <span>EXPORT EXCEL PROFESIONAL</span>
        </button>
      </div>
    </header>

    <!-- PANEL FILTER TANGGAL & KALENDER -->
    <section class="ticket-card p-5 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <!-- PRESET BUTTONS (Quick Filter) -->
        <div class="flex flex-wrap items-center gap-2">
          <button v-for="preset in presets" :key="preset.value" type="button"
            class="mono text-xs px-3.5 py-1.5 rounded transition-all border font-medium" :class="selectedPreset === preset.value
              ? 'bg-[#2b1b12] text-[#faf6ee] border-[#2b1b12] shadow-sm font-semibold'
              : 'bg-[#f4eee3] text-[#8A7A68] border-[#2b1b12]/15 hover:border-[#b8763c] hover:text-[#2b1b12]'"
            @click="applyPreset(preset.value)">
            {{ preset.label }}
          </button>
        </div>

        <!-- INPUT CUSTOM RANGE (DATE PICKER) -->
        <div class="flex items-center gap-2 bg-[#f4eee3] p-2 rounded-md border border-[#2b1b12]/20 text-xs mono">
          <span class="text-[#8A7A68] font-medium">📅 Periode:</span>
          <input v-model="startDate" type="date"
            class="bg-transparent text-[#2b1b12] font-semibold focus:outline-none cursor-pointer"
            @change="selectedPreset = 'custom'" />
          <span class="text-[#8A7A68] font-bold">-</span>
          <input v-model="endDate" type="date"
            class="bg-transparent text-[#2b1b12] font-semibold focus:outline-none cursor-pointer"
            @change="selectedPreset = 'custom'" />
        </div>

      </div>
    </section>

    <!-- ERROR STATE -->
    <div v-if="fetchError" class="ticket-card p-10 text-center space-y-4">
      <p class="mono text-xs text-[#9b3a2e] font-semibold">Gagal memuat data laporan. Periksa koneksi jaringan Anda.</p>
      <button type="button" class="btn-stamp mono inline-flex px-5 py-2 text-xs" @click="refreshReport">
        COBA LAGI
      </button>
    </div>

    <!-- KONTEN UTAMA / SKELETON -->
    <template v-else>

      <!-- METRICS RINGKASAN (KPI CARDS) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <template v-if="pending">
          <div v-for="i in 4" :key="'sk-kpi-' + i" class="ticket-card p-5 space-y-3">
            <div class="skeleton h-3 w-24 rounded"></div>
            <div class="skeleton h-7 w-36 rounded"></div>
            <div class="skeleton h-3 w-20 rounded"></div>
          </div>
        </template>

        <template v-else>
          <div class="ticket-card p-5 space-y-1">
            <p class="mono label-xs text-[#8A7A68]">Total Pendapatan</p>
            <p class="display font-bold text-2xl text-[#2b1b12]">{{ formatRupiah(summaryMetrics.totalRevenue) }}</p>
            <p class="mono text-[0.7rem] text-emerald-800 font-semibold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
              Dari {{ summaryMetrics.totalOrders }} Transaksi
            </p>
          </div>

          <div class="ticket-card p-5 space-y-1">
            <p class="mono label-xs text-[#8A7A68]">Rata-rata / Transaksi</p>
            <p class="display font-bold text-2xl text-[#2b1b12]">{{ formatRupiah(summaryMetrics.avgOrderValue) }}</p>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Nilai Basket Size</p>
          </div>

          <div class="ticket-card p-5 space-y-1">
            <p class="mono label-xs text-[#8A7A68]">Produk Terjual</p>
            <p class="display font-bold text-2xl text-[#b8763c]">{{ summaryMetrics.totalItemsSold }} <span
                class="text-sm font-normal text-[#8A7A68]">item</span></p>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Total Item Terjual</p>
          </div>

          <div class="ticket-card p-5 space-y-1">
            <p class="mono label-xs text-[#8A7A68]">Transaksi Batal / Void</p>
            <p class="display font-bold text-2xl text-[#9b3a2e]">{{ summaryMetrics.cancelledOrders }}</p>
            <p class="mono text-[0.7rem] text-[#9b3a2e]">Kerugian: {{ formatRupiah(summaryMetrics.cancelledAmount) }}
            </p>
          </div>
        </template>

      </section>

      <!-- RINGKASAN METODE PEMBAYARAN & ITEM TERLARIS -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- METODE PEMBAYARAN -->
        <div class="ticket-card p-6 space-y-4 lg:col-span-1">
          <div class="border-b border-[#2b1b12]/10 pb-3">
            <h2 class="display text-lg text-[#2b1b12] font-bold">Metode Pembayaran</h2>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Proporsi pembagian pendapatan</p>
          </div>

          <div v-if="pending" class="space-y-4 py-2">
            <div v-for="i in 3" :key="'sk-pay-' + i" class="space-y-2">
              <div class="flex justify-between">
                <div class="skeleton h-3 w-16 rounded"></div>
                <div class="skeleton h-3 w-20 rounded"></div>
              </div>
              <div class="skeleton h-2.5 w-full rounded-full"></div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div v-for="(amount, method) in paymentBreakdown" :key="method" class="space-y-1.5">
              <div class="flex justify-between text-xs mono">
                <span class="font-bold text-[#2b1b12]">{{ method }}</span>
                <span class="text-[#8A7A68] font-medium">{{ formatRupiah(amount) }}</span>
              </div>
              <div class="w-full bg-[#f4eee3] h-2.5 rounded-full overflow-hidden border border-[#2b1b12]/10">
                <div class="bg-[#b8763c] h-full rounded-full transition-all duration-500"
                  :style="{ width: getPercentage(amount, summaryMetrics.totalRevenue) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU POPULER (TOP PRODUCTS) -->
        <div class="ticket-card p-6 space-y-4 lg:col-span-2">
          <div class="border-b border-[#2b1b12]/10 pb-3">
            <h2 class="display text-lg text-[#2b1b12] font-bold">5 Menu Terlaris Periode Ini</h2>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Berdasarkan kuantitas terjual</p>
          </div>

          <div v-if="pending" class="space-y-3 py-3">
            <div v-for="i in 3" :key="'sk-top-' + i"
              class="flex items-center justify-between py-2 border-b border-[#2b1b12]/5">
              <div class="skeleton h-4 w-40 rounded"></div>
              <div class="skeleton h-4 w-16 rounded"></div>
              <div class="skeleton h-4 w-24 rounded"></div>
            </div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs text-left mono">
              <thead>
                <tr class="border-b border-[#2b1b12]/10 text-[#8A7A68] uppercase tracking-wider">
                  <th class="pb-2.5 font-medium">Nama Menu</th>
                  <th class="pb-2.5 text-center font-medium">Terjual</th>
                  <th class="pb-2.5 text-right font-medium">Total Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2b1b12]/10">
                <tr v-for="(item, idx) in topProducts" :key="idx" class="hover:bg-[#f4eee3]/60 transition-colors">
                  <td class="py-3 font-bold text-[#2b1b12] display text-sm">
                    <span class="mono text-xs text-[#8A7A68] mr-2">#{{ idx + 1 }}</span>
                    {{ item.name }}
                  </td>
                  <td class="py-3 text-center text-[#b8763c] font-bold">{{ item.quantity }} pcs</td>
                  <td class="py-3 text-right font-bold text-[#2b1b12] display">{{ formatRupiah(item.revenue) }}</td>
                </tr>
                <tr v-if="topProducts.length === 0">
                  <td colspan="3" class="py-6 text-center text-[#8A7A68]">Belum ada data produk terjual.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- TABEL DAFTAR TRANSAKSI PERIODE DIPILIH -->
      <main class="ticket-card overflow-hidden space-y-0">
        <div
          class="p-6 border-b border-[#2b1b12]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 class="display text-lg text-[#2b1b12] font-bold">Detail Transaksi Per Hari</h2>
            <p class="mono text-xs text-[#8A7A68]">Menampilkan seluruh transaksi tercatat</p>
          </div>
          <span class="mono label-xs px-2.5 py-1 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10">
            TOTAL {{ pending ? '...' : filteredReport.length }} TRANSAKSI
          </span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">Tanggal & Waktu</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">No. Invoice</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">Pelanggan</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">Kasir</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">Metode</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3.5">Status</th>
                <th scope="col" class="mono label-xs text-right text-[#8A7A68] px-5 py-3.5">Total Nominal</th>
              </tr>
            </thead>

            <tbody v-if="pending" class="divide-y divide-[#2b1b12]/10">
              <tr v-for="i in 5" :key="'sk-row-' + i">
                <td class="px-5 py-4">
                  <div class="skeleton h-3.5 w-28 rounded"></div>
                </td>
                <td class="px-5 py-4">
                  <div class="skeleton h-3.5 w-20 rounded"></div>
                </td>
                <td class="px-5 py-4">
                  <div class="skeleton h-3.5 w-32 rounded"></div>
                </td>
                <td class="px-5 py-4">
                  <div class="skeleton h-3.5 w-24 rounded"></div>
                </td>
                <td class="px-5 py-4">
                  <div class="skeleton h-5 w-16 rounded"></div>
                </td>
                <td class="px-5 py-4">
                  <div class="skeleton h-5 w-16 rounded"></div>
                </td>
                <td class="px-5 py-4 text-right">
                  <div class="skeleton h-4 w-24 rounded ml-auto"></div>
                </td>
              </tr>
            </tbody>

            <tbody v-else class="divide-y divide-[#2b1b12]/10">
              <tr v-for="trx in filteredReport" :key="trx.id" class="hover:bg-[#f4eee3]/60 transition-colors">
                <td class="px-5 py-4 mono text-xs text-[#8A7A68]">
                  {{ formatDate(trx.createdAt) }}
                </td>
                <td class="px-5 py-4 mono font-bold text-[#2b1b12] text-xs">
                  #ORD-{{ String(trx.id).padStart(5, '0') }}
                </td>
                <td class="px-5 py-4 font-bold text-[#2b1b12] display">
                  {{ trx.customerName || 'Pelanggan Anonim' }}
                </td>
                <td class="px-5 py-4 mono text-xs text-[#8A7A68]">
                  {{ getCashierName(trx) }}
                </td>
                <td class="px-5 py-4">
                  <span
                    class="mono label-xs px-2.5 py-1 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10">
                    {{ trx.paymentMethod }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span class="mono label-xs px-2.5 py-1 rounded font-semibold border"
                    :class="getStatusClass(trx.status)">
                    {{ formatStatusLabel(trx.status) }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right display font-bold text-[#2b1b12] text-base">
                  {{ formatRupiah(trx.totalAmount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!pending && filteredReport.length === 0" class="p-12 text-center mono text-xs text-[#8A7A68]">
          Tidak ada data transaksi ditemukan pada rentang tanggal ini.
        </div>
      </main>
    </template>

  </div>
</template>

<script setup>
import ExcelJS from 'exceljs'

definePageMeta({
  middleware: ['owner-only']
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

// --- Preset Tanggal ---
const presets = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Kemarin', value: 'yesterday' },
  { label: '7 Hari Terakhir', value: 'last7days' },
  { label: 'Bulan Ini', value: 'thisMonth' },
  { label: 'Bulan Lalu', value: 'lastMonth' },
]

const selectedPreset = ref('today')
const startDate = ref('')
const endDate = ref('')

function toISODate(date) {
  return date.toISOString().split('T')[0]
}

function applyPreset(presetValue) {
  selectedPreset.value = presetValue
  const now = new Date()

  if (presetValue === 'today') {
    startDate.value = toISODate(now)
    endDate.value = toISODate(now)
  } else if (presetValue === 'yesterday') {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    startDate.value = toISODate(yesterday)
    endDate.value = toISODate(yesterday)
  } else if (presetValue === 'last7days') {
    const past7 = new Date(now)
    past7.setDate(now.getDate() - 6)
    startDate.value = toISODate(past7)
    endDate.value = toISODate(now)
  } else if (presetValue === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = toISODate(firstDay)
    endDate.value = toISODate(now)
  } else if (presetValue === 'lastMonth') {
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    startDate.value = toISODate(firstDayLastMonth)
    endDate.value = toISODate(lastDayLastMonth)
  }
}

onMounted(() => {
  applyPreset('today')
})

// --- API Fetching ---
const { data: response, pending, error: fetchError, refresh: refreshReport } = await useFetch('/api/reports', {
  query: { startDate, endDate }
})

const reportData = computed(() => response.value?.data || [])

const filteredReport = computed(() => {
  if (!startDate.value || !endDate.value) return reportData.value

  const start = new Date(startDate.value + 'T00:00:00')
  const end = new Date(endDate.value + 'T23:59:59')

  return reportData.value.filter(trx => {
    const trxDate = new Date(trx.createdAt)
    return trxDate >= start && trxDate <= end
  })
})

const summaryMetrics = computed(() => {
  const successTrx = filteredReport.value.filter(t => t.status === 'PAID')
  const cancelledTrx = filteredReport.value.filter(t => t.status === 'CANCELLED' || t.status === 'REFUNDED')

  const totalRevenue = successTrx.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0)
  const totalOrders = successTrx.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  let totalItemsSold = 0
  successTrx.forEach(t => {
    if (t.orderItems) {
      totalItemsSold += t.orderItems.reduce((acc, item) => acc + item.quantity, 0)
    }
  })

  const cancelledAmount = cancelledTrx.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0)

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalItemsSold,
    cancelledOrders: cancelledTrx.length,
    cancelledAmount
  }
})

const paymentBreakdown = computed(() => {
  const breakdown = { CASH: 0, QRIS: 0, DEBIT: 0, KREDIT: 0, TRANSFER: 0 }
  filteredReport.value.forEach(trx => {
    if (trx.status === 'PAID' && trx.paymentMethod) {
      breakdown[trx.paymentMethod] = (breakdown[trx.paymentMethod] || 0) + Number(trx.totalAmount || 0)
    }
  })
  return breakdown
})

const topProducts = computed(() => {
  const productMap = {}

  filteredReport.value.forEach(trx => {
    if (trx.status === 'PAID' && trx.orderItems) {
      trx.orderItems.forEach(item => {
        const productName = item.product?.name || 'Produk Tidak Diketahui'
        if (!productMap[productName]) {
          productMap[productName] = { name: productName, quantity: 0, revenue: 0 }
        }
        productMap[productName].quantity += item.quantity
        productMap[productName].revenue += (item.quantity * Number(item.price))
      })
    }
  })

  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
})

// --- Helper Deteksi Kasir Berdasarkan Skema Prisma (cashierId & User) ---
function getCashierName(trx) {
  // Sesuai skema Prisma: Order memiliki relasi 'cashier' (User)
  return trx.cashier?.name || trx.cashier?.username || trx.cashierId || '-'
}

function getStatusClass(status) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
    case 'PENDING':
      return 'bg-amber-100/80 text-amber-900 border-amber-300'
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-red-100/80 text-red-900 border-red-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case 'PAID': return 'LUNAS'
    case 'PENDING': return 'PENDING'
    case 'CANCELLED': return 'BATAL'
    case 'REFUNDED': return 'REFUND'
    default: return status
  }
}

// --- Export Report Excel Profesional ---
async function exportExcelReport() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'POS System'
  workbook.created = new Date()

  const currencyFormat = '"Rp" #,##0'

  const applyHeaderStyle = (sheet) => {
    sheet.getRow(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } }
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2B1B12' } }
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
    sheet.getRow(1).height = 26
  }

  // --- SHEET 1: RINGKASAN KPI ---
  const wsSummary = workbook.addWorksheet('Ringkasan KPI')
  wsSummary.columns = [
    { header: 'METRIK KEUANGAN & OMSET', key: 'metric', width: 45 },
    { header: 'NILAI / JUMLAH', key: 'value', width: 28 }
  ]
  applyHeaderStyle(wsSummary)

  const summaryRows = [
    { metric: 'Total Pendapatan (Lunas)', value: summaryMetrics.value.totalRevenue, isCurrency: true },
    { metric: 'Total Transaksi Sukses', value: summaryMetrics.value.totalOrders, isCurrency: false },
    { metric: 'Rata-rata Nilai Transaksi (Basket Size)', value: summaryMetrics.value.avgOrderValue, isCurrency: true },
    { metric: 'Total Produk Terjual (Pcs)', value: summaryMetrics.value.totalItemsSold, isCurrency: false },
    { metric: 'Jumlah Transaksi Batal / Void', value: summaryMetrics.value.cancelledOrders, isCurrency: false },
    { metric: 'Total Kerugian Transaksi Batal', value: summaryMetrics.value.cancelledAmount, isCurrency: true }
  ]

  summaryRows.forEach((item) => {
    const row = wsSummary.addRow({ metric: item.metric, value: item.value })
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' }
    if (item.isCurrency) {
      row.getCell(2).numFmt = currencyFormat
    }
    row.border = {
      bottom: { style: 'thin', color: { argb: 'E5E0D8' } },
      left: { style: 'thin', color: { argb: 'E5E0D8' } },
      right: { style: 'thin', color: { argb: 'E5E0D8' } }
    }
    row.height = 22
  })

  // --- SHEET 2: METODE PEMBAYARAN ---
  const wsPayment = workbook.addWorksheet('Metode Pembayaran')
  wsPayment.columns = [
    { header: 'METODE PEMBAYARAN', key: 'method', width: 25 },
    { header: 'TOTAL PENDAPATAN', key: 'amount', width: 25 }
  ]
  applyHeaderStyle(wsPayment)

  Object.entries(paymentBreakdown.value).forEach(([method, amount]) => {
    const row = wsPayment.addRow({ method, amount: Number(amount) })
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(2).numFmt = currencyFormat
    row.height = 22
  })

  // --- SHEET 3: MENU TERLARIS ---
  const wsTop = workbook.addWorksheet('Menu Terlaris')
  wsTop.columns = [
    { header: 'PERINGKAT', key: 'rank', width: 15 },
    { header: 'NAMA MENU', key: 'name', width: 35 },
    { header: 'QTY TERJUAL', key: 'quantity', width: 18 },
    { header: 'TOTAL SUBTOTAL', key: 'revenue', width: 25 }
  ]
  applyHeaderStyle(wsTop)

  topProducts.value.forEach((item, index) => {
    const row = wsTop.addRow({
      rank: `#${index + 1}`,
      name: item.name,
      quantity: item.quantity,
      revenue: item.revenue
    })
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(4).numFmt = currencyFormat
    row.height = 22
  })

  // --- SHEET 4: DETAIL TRANSAKSI ---
  const wsDetail = workbook.addWorksheet('Detail Transaksi')
  wsDetail.columns = [
    { header: 'TANGGAL & WAKTU', key: 'date', width: 22 },
    { header: 'NO. INVOICE', key: 'invoice', width: 16 },
    { header: 'PELANGGAN', key: 'customer', width: 25 },
    { header: 'KASIR', key: 'cashier', width: 20 },
    { header: 'METODE', key: 'method', width: 15 },
    { header: 'STATUS', key: 'status', width: 15 },
    { header: 'TOTAL NOMINAL', key: 'total', width: 22 }
  ]
  applyHeaderStyle(wsDetail)

  filteredReport.value.forEach(trx => {
    const row = wsDetail.addRow({
      date: formatDate(trx.createdAt),
      invoice: `#ORD-${String(trx.id).padStart(5, '0')}`,
      customer: trx.customerName || 'Pelanggan Anonim',
      cashier: getCashierName(trx),
      method: trx.paymentMethod,
      status: formatStatusLabel(trx.status),
      total: Number(trx.totalAmount)
    })
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' }
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(7).numFmt = currencyFormat
    row.height = 22
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `Laporan_Keuangan_${startDate.value}_sd_${endDate.value}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

function getPercentage(part, total) {
  if (!total || total === 0) return 0
  return Math.round((part / total) * 100)
}

function formatRupiah(amount) {
  const num = Number(amount)
  if (isNaN(num) || num === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.label-xs {
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.ticket-card {
  background: #faf6ee;
  border-radius: 6px;
  border: 1.5px solid rgba(43, 27, 18, 0.14);
  box-shadow: 0 10px 25px -5px rgba(43, 27, 18, 0.12), 0 4px 6px -2px rgba(43, 27, 18, 0.05);
  position: relative;
}

.btn-stamp {
  background: #2b1b12;
  color: #faf6ee;
  font-weight: 600;
  letter-spacing: 0.12em;
  border-radius: 4px;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-stamp:hover:not(:disabled) {
  background: #b8763c;
  border-color: #b8763c;
  transform: rotate(-0.5deg) scale(1.01);
  box-shadow: 0 4px 12px rgba(184, 118, 60, 0.25);
}

.btn-stamp:active:not(:disabled) {
  transform: scale(0.98);
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }

  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, #eadecc 25%, #f2ebd9 50%, #eadecc 75%);
  background-size: 200px 100%;
  animation: shimmer 1.4s infinite linear;
}
</style>