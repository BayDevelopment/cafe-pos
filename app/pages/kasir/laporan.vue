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
        <button 
          type="button" 
          class="btn-stamp mono w-full md:w-auto px-5 py-2.5 text-xs flex items-center justify-center gap-2"
          @click="exportReport"
        >
          <span>📥</span> EXPORT CSV / PRINT
        </button>
      </div>
    </header>

    <!-- PANEL FILTER TANGGAL & KALENDER -->
    <section class="ticket-card p-5 space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <!-- PRESET BUTTONS (Quick Filter) -->
        <div class="flex flex-wrap items-center gap-2">
          <button 
            v-for="preset in presets" 
            :key="preset.value"
            type="button"
            class="mono text-xs px-3.5 py-1.5 rounded transition-all border font-medium"
            :class="selectedPreset === preset.value 
              ? 'bg-[#2b1b12] text-[#faf6ee] border-[#2b1b12] shadow-sm font-semibold' 
              : 'bg-[#f4eee3] text-[#8A7A68] border-[#2b1b12]/15 hover:border-[#b8763c] hover:text-[#2b1b12]'"
            @click="applyPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- INPUT CUSTOM RANGE (DATE PICKER) -->
        <div class="flex items-center gap-2 bg-[#f4eee3] p-2 rounded-md border border-[#2b1b12]/20 text-xs mono">
          <span class="text-[#8A7A68] font-medium">📅 Periode:</span>
          <input 
            v-model="startDate" 
            type="date" 
            class="bg-transparent text-[#2b1b12] font-semibold focus:outline-none cursor-pointer"
            @change="selectedPreset = 'custom'"
          />
          <span class="text-[#8A7A68] font-bold">-</span>
          <input 
            v-model="endDate" 
            type="date" 
            class="bg-transparent text-[#2b1b12] font-semibold focus:outline-none cursor-pointer"
            @change="selectedPreset = 'custom'"
          />
        </div>

      </div>
    </section>

    <!-- LOADING STATE -->
    <div v-if="pending" class="ticket-card p-12 text-center mono text-xs text-[#8A7A68] tracking-widest animate-pulse">
      ⏳ MENGHITUNG DAN MEMUAT LAPORAN...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-4">
      <p class="mono text-xs text-[#9b3a2e] font-semibold">Gagal memuat data laporan. Periksa koneksi jaringan Anda.</p>
      <button 
        type="button" 
        class="btn-stamp mono inline-flex px-5 py-2 text-xs"
        @click="refreshReport"
      >
        COBA LAGI
      </button>
    </div>

    <template v-else>
      <!-- METRICS RINGKASAN (KPI CARDS) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
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
          <p class="display font-bold text-2xl text-[#b8763c]">{{ summaryMetrics.totalItemsSold }} <span class="text-sm font-normal text-[#8A7A68]">item</span></p>
          <p class="mono text-[0.7rem] text-[#8A7A68]">Total Item Terjual</p>
        </div>

        <div class="ticket-card p-5 space-y-1">
          <p class="mono label-xs text-[#8A7A68]">Transaksi Batal / Void</p>
          <p class="display font-bold text-2xl text-[#9b3a2e]">{{ summaryMetrics.cancelledOrders }}</p>
          <p class="mono text-[0.7rem] text-[#9b3a2e]">Kerugian: {{ formatRupiah(summaryMetrics.cancelledAmount) }}</p>
        </div>

      </section>

      <!-- RINGKASAN METODE PEMBAYARAN & ITEM TERLARIS -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- METODE PEMBAYARAN -->
        <div class="ticket-card p-6 space-y-4 lg:col-span-1">
          <div class="border-b border-[#2b1b12]/10 pb-3">
            <h2 class="display text-lg text-[#2b1b12] font-bold">Metode Pembayaran</h2>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Proporsi pembagian pendapatan</p>
          </div>
          <div class="space-y-4">
            <div v-for="(amount, method) in paymentBreakdown" :key="method" class="space-y-1.5">
              <div class="flex justify-between text-xs mono">
                <span class="font-bold text-[#2b1b12]">{{ method }}</span>
                <span class="text-[#8A7A68] font-medium">{{ formatRupiah(amount) }}</span>
              </div>
              <div class="w-full bg-[#f4eee3] h-2.5 rounded-full overflow-hidden border border-[#2b1b12]/10">
                <div 
                  class="bg-[#b8763c] h-full rounded-full transition-all duration-500" 
                  :style="{ width: getPercentage(amount, summaryMetrics.totalRevenue) + '%' }"
                ></div>
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
          <div class="overflow-x-auto">
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
        <div class="p-6 border-b border-[#2b1b12]/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 class="display text-lg text-[#2b1b12] font-bold">Detail Transaksi Per Hari</h2>
            <p class="mono text-xs text-[#8A7A68]">Menampilkan seluruh transaksi tercatat</p>
          </div>
          <span class="mono label-xs px-2.5 py-1 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10">
            TOTAL {{ filteredReport.length }} TRANSAKSI
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
            <tbody class="divide-y divide-[#2b1b12]/10">
              <tr 
                v-for="trx in filteredReport" 
                :key="trx.id"
                class="hover:bg-[#f4eee3]/60 transition-colors"
              >
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
                  {{ trx.cashier?.name || '-' }}
                </td>
                <td class="px-5 py-4">
                  <span class="mono label-xs px-2.5 py-1 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10">
                    {{ trx.paymentMethod }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span 
                    class="mono label-xs px-2.5 py-1 rounded font-semibold border"
                    :class="getStatusClass(trx.status)"
                  >
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

        <div v-if="filteredReport.length === 0" class="p-12 text-center mono text-xs text-[#8A7A68]">
          Tidak ada data transaksi ditemukan pada rentang tanggal ini.
        </div>
      </main>
    </template>

  </div>
</template>

<script setup>
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

// Helper format ISO Date (YYYY-MM-DD)
function toISODate(date) {
  return date.toISOString().split('T')[0]
}

// Mengatur Rentang Tanggal Berdasarkan Preset
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

// Filter data reaktif berdasarkan kurun waktu
const filteredReport = computed(() => {
  if (!startDate.value || !endDate.value) return reportData.value

  const start = new Date(startDate.value + 'T00:00:00')
  const end = new Date(endDate.value + 'T23:59:59')

  return reportData.value.filter(trx => {
    const trxDate = new Date(trx.createdAt)
    return trxDate >= start && trxDate <= end
  })
})

// --- Ringkasan Metrics (KPI) sesuai OrderStatus Enum ---
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

// --- Breakdown Metode Pembayaran sesuai PaymentMethod Enum ---
const paymentBreakdown = computed(() => {
  const breakdown = { CASH: 0, QRIS: 0, DEBIT: 0, KREDIT: 0, TRANSFER: 0 }
  filteredReport.value.forEach(trx => {
    if (trx.status === 'PAID' && trx.paymentMethod) {
      breakdown[trx.paymentMethod] = (breakdown[trx.paymentMethod] || 0) + Number(trx.totalAmount || 0)
    }
  })
  return breakdown
})

// --- Menu Terlaris (Top 5 Products) berdasarkan OrderItem & Product ---
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

// --- Helper Tampilan Status ---
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

// --- Export Report ---
function exportReport() {
  window.print()
}

// --- Formatters ---
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

/* Card Vintage ala Tiket / Receipt Kasir */
.ticket-card {
  background: #faf6ee;
  border-radius: 6px;
  border: 1.5px solid rgba(43, 27, 18, 0.14);
  box-shadow: 0 10px 25px -5px rgba(43, 27, 18, 0.12), 0 4px 6px -2px rgba(43, 27, 18, 0.05);
  position: relative;
}

/* Tombol bergaya Stempel */
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

/* Print Optimization */
@media print {
  body {
    background: white !important;
  }
  .ticket-card {
    box-shadow: none !important;
    border-color: #000 !important;
  }
  .btn-stamp, input {
    border: none !important;
  }
}
</style>