<!-- app/pages/kasir/transaksi.vue -->
<template>
  <div class="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">KASIR</span>
          <span class="mono label-xs text-[#8A7A68]">RIWAYAT PENJUALAN</span>
        </div>
        <h1 class="display text-2xl text-[#2b1b12] font-bold">Daftar Transaksi</h1>
        <p class="mono text-xs text-[#8A7A68] mt-0.5">Pantau dan kelola semua histori pembayaran pelanggan.</p>
      </div>

      <!-- RINGKASAN SINGKAT HARI INI -->
      <div class="flex gap-3 text-right">
        <div class="bg-[#f4eee3] p-3 rounded border border-[#2b1b12]/10">
          <p class="mono label-xs text-[#8A7A68]">Total Penjualan</p>
          <p class="display font-bold text-[#2b1b12] text-lg">{{ formatRupiah(summary.totalAmount) }}</p>
        </div>
      </div>
    </header>

    <!-- FILTER & PENCARIAN -->
    <div class="ticket-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="relative w-full sm:w-72">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari ID / Nama Pelanggan..."
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]"
        />
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
        <select 
          v-model="selectedStatus" 
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]"
        >
          <option value="">Semua Status</option>
          <option value="SUCCESS">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>

        <select 
          v-model="selectedPayment" 
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]"
        >
          <option value="">Semua Pembayaran</option>
          <option value="QRIS">QRIS</option>
          <option value="CASH">Tunai (Cash)</option>
          <option value="DEBIT">Kartu Debit</option>
        </select>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68]">
      MEMUAT DATA TRANSAKSI...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">Gagal memuat data transaksi. Periksa koneksi atau coba lagi.</p>
      <button 
        type="button" 
        class="btn-stamp mono inline-flex px-4 py-2 text-xs"
        @click="refreshTransactions"
      >
        COBA LAGI
      </button>
    </div>

    <!-- TABEL TRANSAKSI -->
    <main v-else class="ticket-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
              <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">ID Transaksi</th>
              <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Waktu</th>
              <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Pelanggan</th>
              <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Metode</th>
              <th scope="col" class="mono label-xs text-[#8A7A68] px-5 py-3">Status</th>
              <th scope="col" class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Total</th>
              <th scope="col" class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2b1b12]/5">
            <tr 
              v-for="trx in filteredTransactions" 
              :key="trx.id"
              class="hover:bg-[#f4eee3]/50 transition-colors"
            >
              <td class="px-5 py-4 mono font-bold text-[#2b1b12]">
                #{{ trx.invoiceNo }}
              </td>
              <td class="px-5 py-4 mono text-xs text-[#8A7A68]">
                {{ formatDate(trx.createdAt) }}
              </td>
              <td class="px-5 py-4 font-semibold text-[#2b1b12] display">
                {{ trx.customerName || 'Pelanggan Anonim' }}
              </td>
              <td class="px-5 py-4">
                <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10">
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
              <td class="px-5 py-4 text-right">
                <button 
                  type="button"
                  class="mono text-xs text-[#b8763c] hover:underline font-semibold"
                  @click="openDetailModal(trx)"
                >
                  Detail
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredTransactions.length === 0" class="p-10 text-center mono text-xs text-[#8A7A68]">
        Tidak ada transaksi yang ditemukan.
      </div>
    </main>

    <!-- MODAL DETAIL TRANSAKSI & STRUK -->
    <Teleport to="body">
      <div 
        v-if="selectedTrx" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeDetailModal"
      >
        <div class="ticket-card w-full max-w-md p-6 space-y-5">
          <!-- Header Struk -->
          <div class="text-center border-b border-dashed border-[#2b1b12]/20 pb-4">
            <h2 class="display text-xl text-[#2b1b12] font-bold">RUMAH KOPI</h2>
            <p class="mono text-xs text-[#8A7A68]">Struk Pembayaran #{{ selectedTrx.invoiceNo }}</p>
            <p class="mono label-xs text-[#8A7A68] mt-1">{{ formatDate(selectedTrx.createdAt) }}</p>
          </div>

          <!-- Rincian Item -->
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div 
              v-for="item in selectedTrx.items" 
              :key="item.id" 
              class="flex justify-between items-start text-xs mono"
            >
              <div>
                <p class="font-bold text-[#2b1b12]">{{ item.productName }}</p>
                <p class="text-[#8A7A68]">{{ item.qty }}x @{{ formatRupiah(item.price) }}</p>
                <p v-if="item.note" class="text-[0.65rem] italic text-[#b8763c]">Catatan: {{ item.note }}</p>
              </div>
              <p class="font-bold text-[#2b1b12]">{{ formatRupiah(item.qty * item.price) }}</p>
            </div>
          </div>

          <!-- Total & Pembayaran -->
          <div class="border-t border-dashed border-[#2b1b12]/20 pt-4 space-y-1.5 mono text-xs">
            <div class="flex justify-between text-[#8A7A68]">
              <span>Subtotal</span>
              <span>{{ formatRupiah(selectedTrx.subtotal) }}</span>
            </div>
            <div v-if="selectedTrx.tax" class="flex justify-between text-[#8A7A68]">
              <span>Pajak (10%)</span>
              <span>{{ formatRupiah(selectedTrx.tax) }}</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-[#2b1b12] pt-1">
              <span>TOTAL</span>
              <span>{{ formatRupiah(selectedTrx.totalAmount) }}</span>
            </div>
            <div class="flex justify-between text-[#8A7A68] pt-1">
              <span>Metode Pembayaran</span>
              <span class="font-bold">{{ selectedTrx.paymentMethod }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-3 pt-2">
            <button 
              type="button" 
              class="btn-stamp mono flex-1 py-2.5 text-xs"
              @click="printReceipt(selectedTrx)"
            >
              🖨️ CETAK STRUK
            </button>
            <button 
              type="button" 
              class="mono text-xs text-[#8A7A68] hover:text-[#2b1b12] px-4 py-2.5 transition"
              @click="closeDetailModal"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

// --- Data Fetching ---
const { data: response, pending, error: fetchError, refresh: refreshTransactions } = await useFetch('/api/transactions')
const transactions = computed(() => response.value?.data || [])

// Summary Ringkasan Total Penjualan
const summary = computed(() => {
  const totalAmount = transactions.value
    .filter(t => t.status === 'SUCCESS')
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
  return { totalAmount }
})

// --- Filter State ---
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedPayment = ref('')

const filteredTransactions = computed(() => {
  return transactions.value.filter(trx => {
    const matchQuery = trx.invoiceNo.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                       (trx.customerName && trx.customerName.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchStatus = !selectedStatus.value || trx.status === selectedStatus.value
    const matchPayment = !selectedPayment.value || trx.paymentMethod === selectedPayment.value

    return matchQuery && matchStatus && matchPayment
  })
})

// --- Detail Modal State ---
const selectedTrx = ref(null)

function openDetailModal(trx) {
  selectedTrx.value = trx
}

function closeDetailModal() {
  selectedTrx.value = null
}

function printReceipt(trx) {
  alert(`Mencetak struk untuk transaksi #${trx.invoiceNo}...`)
  // Di aplikasi nyata, fungsi ini memanggil window.print() atau thermal printer API
}

// --- Helper Formatter ---
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

.btn-stamp:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>