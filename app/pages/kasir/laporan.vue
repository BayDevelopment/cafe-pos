<!-- app/pages/kasir/laporan.vue -->
<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">ANALISIS</span>
          <span class="mono label-xs text-[#8A7A68]">LAPORAN PENJUALAN</span>
        </div>
        <h1 class="display text-2xl text-[#2b1b12] font-bold">Laporan Keuangan & Omset</h1>
        <p class="mono text-xs text-[#8A7A68] mt-0.5">Analisis tren penjualan, pendapatan, dan statistik menu favorit.</p>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="flex items-center gap-2">
        <button 
          type="button" 
          class="btn-stamp mono px-4 py-2.5 text-xs"
          @click="exportReport"
        >
          📥 EXPORT CSV / PRINT
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
            class="mono text-xs px-3 py-1.5 rounded transition-all border"
            :class="selectedPreset === preset.value 
              ? 'bg-[#2b1b12] text-[#faf6ee] border-[#2b1b12] font-semibold' 
              : 'bg-[#f4eee3] text-[#8A7A68] border-[#2b1b12]/10 hover:border-[#b8763c] hover:text-[#2b1b12]'"
            @click="applyPreset(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- INPUT CUSTOM RANGE (DATE PICKER) -->
        <div class="flex items-center gap-2 bg-[#f4eee3] p-2 rounded border border-[#2b1b12]/20 text-xs mono">
          <span class="text-[#8A7A68]">📅 Periode:</span>
          <input 
            v-model="startDate" 
            type="date" 
            class="bg-transparent text-[#2b1b12] font-semibold focus:outline-none cursor-pointer"
            @change="selectedPreset = 'custom'"
          />
          <span class="text-[#8A7A68]">-</span>
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
    <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68]">
      MENGHITUNG DAN MEMUAT LAPORAN...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">Gagal memuat laporan data. Periksa koneksi atau coba lagi.</p>
      <button 
        type="button" 
        class="btn-stamp mono inline-flex px-4 py-2 text-xs"
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
          <p class="mono text-[0.7rem] text-emerald-700 font-medium">Dari {{ summaryMetrics.totalOrders }} Transaksi</p>
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
          <p class="mono label-xs text-[#8A7A68]">Transaksi Batal/Void</p>
          <p class="display font-bold text-2xl text-[#9b3a2e]">{{ summaryMetrics.cancelledOrders }}</p>
          <p class="mono text-[0.7rem] text-[#9b3a2e]">Kerugian: {{ formatRupiah(summaryMetrics.cancelledAmount) }}</p>
        </div>

      </section>

      <!-- RINGKASAN METODE PEMBAYARAN & ITEM TERLARIS -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- METODE PEMBAYARAN -->
        <div class="ticket-card p-6 space-y-4 lg:col-span-1">
          <h2 class="display text-lg text-[#2b1b12] font-bold">Metode Pembayaran</h2>
          <div class="space-y-3">
            <div v-for="(amount, method) in paymentBreakdown" :key="method" class="space-y-1">
              <div class="flex justify-between text-xs mono">
                <span class="font-semibold text-[#2b1b12]">{{ method }}</span>
                <span class="text-[#8A7A68]">{{ formatRupiah(amount) }}</span>
              </div>
              <div class="w-full bg-[#f4eee3] h-2 rounded-full overflow-hidden">
                <div 
                  class="bg-[#b8763c] h-full rounded-full" 
                  :style="{ width: getPercentage(amount, summaryMetrics.totalRevenue) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- MENU POPULER (TOP PRODUCTS) -->
        <div class="ticket-card p-6 space-y-4 lg:col-span-2">
          <h2 class="display text-lg text-[#2b1b12] font-bold">5 Menu Terlaris Periode Ini</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left mono">
              <thead>
                <tr class="border-b border-[#2b1b12]/10 text-[#8A7A68] pb-2">
                  <th class="pb-2">Nama Menu</th>
                  <th class="pb-2 text-center">Terjual</th>
                  <th class="pb-2 text-right">Total Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2b1b12]/5">
                <tr v-for="(item, idx) in topProducts" :key="idx" class="hover:bg-[#f4eee3]/50">
                  <td class="py-2.5 font-bold text-[#2b1b12] display text-sm">{{ item.name }}</td>
                  <td class="py-2.5 text-center text-[#b8763c] font-semibold">{{ item.qty }} pcs</td>
                  <td class="py-2.5 text-right font-bold text-[#2b1b12]">{{ formatRupiah(item.revenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </section>

      <!-- TABEL DAFTAR TRANSAKSI PERIODE DIPILIH -->
      <main class="ticket-card overflow-hidden space-y-4">
        <div class="p-6 pb-0 flex justify-between items-center">
          <h2 class="display text-lg text-[#2b1b12] font-bold">Detail Transaksi Per Hari</h2>
          <p class="mono text-xs text-[#8A7A68]">Menampilkan data {{ filteredReport.length }} transaksi</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Tanggal & Waktu</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Invoice</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Pelanggan</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Metode</th>
                <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Status</th>
                <th scope="col" class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Total Nominal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#2b1b12]/5">
              <tr 
                v-for="trx in filteredReport" 
                :key="trx.id"
                class="hover:bg-[#f4eee3]/50 transition-colors"
              >
                <td class="px-5 py-4 mono text-xs text-[#8A7A68]">
                  {{ formatDate(trx.createdAt) }}
                </td>
                <td class="px-5 py-4 mono font-bold text-[#2b1b12]">
                  #{{ trx.invoiceNo }}
                </td>
                <td class="px-5 py-4 font-semibold text-[#2b1b12] display">
                  {{ trx.customerName || 'Pelanggan Anonim' }}
                </td>
                <td class="px-5 py-4">
                  <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12]/5 text-[#2b1b12]">
                    {{ trx.paymentMethod }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span 
                    class="mono label-xs px-2 py-0.5 rounded"
                    :class="trx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ trx.status === 'SUCCESS' ? 'SELESAI' : 'BATAL' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right display font-bold text-[#2b1b12]">
                  {{ formatRupiah(trx.totalAmount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredReport.length === 0" class="p-10 text-center mono text-xs text-[#8A7A68]">
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

// Inisialisasi awal ke 'Hari Ini'
onMounted(() => {
  applyPreset('today')
})

// --- API Fetching ---
// Mengirim query parameter startDate & endDate ke backend
const { data: response, pending, error: fetchError, refresh: refreshReport } = await useFetch('/api/reports', {
  query: { startDate, endDate }
})

const reportData = computed(() => response.value?.data || [])

// Filter data secara reaktif di client-side
const filteredReport = computed(() => {
  if (!startDate.value || !endDate.value) return reportData.value

  const start = new Date(startDate.value + 'T00:00:00')
  const end = new Date(endDate.value + 'T23:59:59')

  return reportData.value.filter(trx => {
    const trxDate = new Date(trx.createdAt)
    return trxDate >= start && trxDate <= end
  })
})

// --- Ringkasan Metrics (KPI) ---
const summaryMetrics = computed(() => {
  const successTrx = filteredReport.value.filter(t => t.status === 'SUCCESS')
  const cancelledTrx = filteredReport.value.filter(t => t.status === 'CANCELLED')

  const totalRevenue = successTrx.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
  const totalOrders = successTrx.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  let totalItemsSold = 0
  successTrx.forEach(t => {
    if (t.items) {
      totalItemsSold += t.items.reduce((acc, item) => acc + item.qty, 0)
    }
  })

  const cancelledAmount = cancelledTrx.reduce((sum, t) => sum + (t.totalAmount || 0), 0)

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    totalItemsSold,
    cancelledOrders: cancelledTrx.length,
    cancelledAmount
  }
})

// --- Breakdown Metode Pembayaran ---
const paymentBreakdown = computed(() => {
  const breakdown = { QRIS: 0, CASH: 0, DEBIT: 0 }
  filteredReport.value.forEach(trx => {
    if (trx.status === 'SUCCESS' && trx.paymentMethod) {
      breakdown[trx.paymentMethod] = (breakdown[trx.paymentMethod] || 0) + trx.totalAmount
    }
  })
  return breakdown
})

// --- Menu Terlaris (Top 5 Products) ---
const topProducts = computed(() => {
  const productMap = {}

  filteredReport.value.forEach(trx => {
    if (trx.status === 'SUCCESS' && trx.items) {
      trx.items.forEach(item => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = { name: item.productName, qty: 0, revenue: 0 }
        }
        productMap[item.productName].qty += item.qty
        productMap[item.productName].revenue += (item.qty * item.price)
      })
    }
  })

  return Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
})

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
  if (!amount) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)
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
.display {
  font-family: 'Space Grotesk', sans-serif;
}

.mono {
  font-family: 'IBM Plex Mono', monospace;
}

.label-xs {
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.ticket-card {
  background: #faf6ee;
  border-radius: 6px;
  border: 1.5px solid rgba(43, 27, 18, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  position: relative;
}

.btn-stamp {
  background: #2b1b12;
  color: #faf6ee;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  padding: 0.85rem 1rem;
  border-radius: 4px;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: #b8763c;
  border-color: #b8763c;
  transform: rotate(-0.6deg) scale(1.01);
}

/* CSS Media Print untuk mencetak halaman dengan rapi */
@media print {
  body {
    background: white !important;
  }
  .btn-stamp, input, select {
    display: none !important;
  }
}
</style>