<!-- app/pages/kasir/order/[id].vue -->
<template>
  <div class="p-4 md:p-10 max-w-2xl mx-auto space-y-6 font-sans">

    <!-- TOMBOL AKSI / NAVIGASI (HILANG SAAT DICETAK) -->
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <NuxtLink 
        to="/kasir/pos" 
        class="mono text-xs text-[#8A7A68] hover:text-[#2b1b12] flex items-center gap-1"
      >
        ← Kembali ke POS
      </NuxtLink>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button 
          type="button"
          class="btn-stamp mono px-4 py-2 text-xs flex-1 sm:flex-none"
          @click="printReceipt"
        >
          🖨️ CETAK STRUK
        </button>
        <NuxtLink 
          to="/kasir/pos" 
          class="btn-stamp btn-secondary mono px-4 py-2 text-xs flex-1 sm:flex-none text-center"
        >
          ＋ TRANSAKSI BARU
        </NuxtLink>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68]">
      MEMUAT DETAIL TRANSAKSI...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError || !order" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">Transaksi tidak ditemukan atau gagal memuat data.</p>
      <NuxtLink to="/kasir/pos" class="btn-stamp mono inline-flex px-4 py-2 text-xs">
        KEMBALI KE POS
      </NuxtLink>
    </div>

    <!-- TAMPILAN STRUK PEMBAYARAN (PRINTABLE AREA) -->
    <div v-else class="ticket-card p-6 md:p-8 space-y-6 print:shadow-none print:border-none print:p-0">
      
      <!-- HEADER STRUK -->
      <div class="text-center space-y-1 border-b border-dashed border-[#2b1b12]/20 pb-4">
        <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee] inline-block mb-1">STRUK PEMBAYARAN</span>
        <h1 class="display text-2xl font-bold text-[#2b1b12]">COFFEE SHOP POS</h1>
        <p class="mono text-[0.7rem] text-[#8A7A68]">Jl. Kopi No. 12, Banten • Telp: 0812-3456-7890</p>
      </div>

      <!-- METADATA TRANSAKSI -->
      <div class="grid grid-cols-2 gap-2 mono text-xs border-b border-dashed border-[#2b1b12]/20 pb-4">
        <div>
          <p class="text-[#8A7A68]">ID Transaksi:</p>
          <p class="font-bold text-[#2b1b12]">#{{ order.id }}</p>
        </div>
        <div class="text-right">
          <p class="text-[#8A7A68]">Tanggal & Waktu:</p>
          <p class="font-bold text-[#2b1b12]">{{ formatDate(order.createdAt) }}</p>
        </div>
        <div>
          <p class="text-[#8A7A68]">Kasir:</p>
          <p class="font-bold text-[#2b1b12]">{{ order.cashier?.name || 'Kasir' }}</p>
        </div>
        <div class="text-right">
          <p class="text-[#8A7A68]">Metode Bayar:</p>
          <p class="font-bold text-[#2b1b12]">{{ order.paymentMethod }}</p>
        </div>
      </div>

      <!-- RINCIAN ORDER ITEM (MODEL OrderItem) -->
      <div class="space-y-3">
        <div class="flex justify-between items-center mono label-xs text-[#8A7A68] border-b border-[#2b1b12]/10 pb-2">
          <span>ITEM</span>
          <div class="flex gap-4">
            <span>QTY</span>
            <span class="w-20 text-right">TOTAL</span>
          </div>
        </div>

        <div class="space-y-2.5">
          <div 
            v-for="item in order.orderItems" 
            :key="item.id"
            class="flex justify-between items-start text-xs font-mono"
          >
            <div class="pr-2 flex-1">
              <p class="font-bold text-[#2b1b12]">{{ item.product?.name || 'Produk' }}</p>
              <p class="text-[0.68rem] text-[#8A7A68]">@ {{ formatCurrency(item.price) }}</p>
            </div>
            <div class="flex gap-4 items-start">
              <span class="text-[#2b1b12] font-bold">x{{ item.quantity }}</span>
              <span class="w-20 text-right font-bold text-[#2b1b12]">
                {{ formatCurrency(Number(item.price) * item.quantity) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- TOTAL & PEMBAYARAN -->
      <div class="border-t border-dashed border-[#2b1b12]/20 pt-4 space-y-2 font-mono text-xs">
        <div v-if="Number(order.discount) > 0" class="flex justify-between text-[#8A7A68]">
          <span>Diskon</span>
          <span>- {{ formatCurrency(order.discount) }}</span>
        </div>
        <div class="flex justify-between items-center text-sm font-bold text-[#2b1b12] pt-1 border-t border-[#2b1b12]/10">
          <span>TOTAL BAYAR</span>
          <span class="display text-lg text-[#b8763c]">{{ formatCurrency(order.totalAmount) }}</span>
        </div>
        <div class="flex justify-between text-[0.7rem] text-[#8A7A68] pt-1">
          <span>Status Pembayaran</span>
          <span class="font-bold text-[#2f7a46]">{{ order.status }}</span>
        </div>
      </div>

      <!-- CATATAN TRANSAKSI (JIKA ADA) -->
      <div v-if="order.note" class="bg-[#f4eee3] p-3 rounded text-xs mono text-[#8A7A68] border border-[#2b1b12]/10">
        <p class="font-bold text-[#2b1b12] mb-0.5">Catatan:</p>
        <p>{{ order.note }}</p>
      </div>

      <!-- FOOTER STRUK -->
      <div class="text-center pt-4 border-t border-dashed border-[#2b1b12]/20 space-y-1">
        <p class="display text-xs font-bold text-[#2b1b12]">Terima Kasih Atas Kunjungan Anda!</p>
        <p class="mono text-[0.65rem] text-[#8A7A68]">Simpan struk ini sebagai bukti pembayaran yang sah.</p>
      </div>

    </div>

  </div>
</template>

<script setup>
useHead({
  title: 'Struk Transaksi - POS',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

const route = useRoute()

// Fetch detail transaksi berdasarkan ID dari URL (/kasir/order/1)
const { data: response, pending, error: fetchError } = await useFetch(`/api/orders/${route.params.id}`)
const order = computed(() => response.value?.data || null)

function formatCurrency(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID')
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function printReceipt() {
  window.print()
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
  font-weight: 600;
  letter-spacing: 0.1em;
  border-radius: 4px;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-stamp:hover {
  background: #b8763c;
  border-color: #b8763c;
}

.btn-secondary {
  background: #f4eee3;
  color: #2b1b12;
  border-color: rgba(43, 27, 18, 0.2);
}

.btn-secondary:hover {
  background: #e8decb;
  border-color: #2b1b12;
}

/* CSS Khusus Mode Cetak (Thermal Paper Friendly) */
@media print {
  body {
    background: white !important;
  }
  .ticket-card {
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
  }
}
</style>