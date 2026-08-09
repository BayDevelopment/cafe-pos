<template>
  <div class="p-4 md:p-10 max-w-2xl mx-auto space-y-6 font-sans print:p-0 print:m-0 print:max-w-none">

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
    <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68] print:hidden">
      MEMUAT DETAIL TRANSAKSI...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError || !order" class="ticket-card p-10 text-center space-y-3 print:hidden">
      <p class="mono text-xs text-[#9b3a2e]">
        {{ fetchError?.data?.statusMessage || 'Transaksi tidak ditemukan atau gagal memuat data.' }}
      </p>
      <NuxtLink to="/kasir/pos" class="btn-stamp mono inline-flex px-4 py-2 text-xs">
        KEMBALI KE POS
      </NuxtLink>
    </div>

    <!-- TAMPILAN STRUK PEMBAYARAN (PRINTABLE AREA) -->
    <div v-else class="receipt-body ticket-card p-6 md:p-8 space-y-5 print:p-0 print:shadow-none print:border-none">
      
      <!-- HEADER STRUK -->
      <div class="text-center space-y-1 border-b border-dashed border-[#2b1b12]/30 pb-3">
        <h1 class="display text-xl font-bold text-[#2b1b12] uppercase tracking-wide">COFFEE SHOP POS</h1>
        <p class="mono text-[0.68rem] text-[#8A7A68] print:text-black">Jl. Kopi No. 12, Banten</p>
        <p class="mono text-[0.68rem] text-[#8A7A68] print:text-black">Telp: 0812-3456-7890</p>
      </div>

      <!-- METADATA TRANSAKSI -->
      <div class="mono text-[0.7rem] border-b border-dashed border-[#2b1b12]/30 pb-3 space-y-1">
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">No. Struk:</span>
          <span class="font-bold text-[#2b1b12]">#{{ formatInvoiceNo(order.id) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Waktu:</span>
          <span class="font-bold text-[#2b1b12]">{{ formatDate(order.createdAt) }}</span>
        </div>

        <!-- BARIS KASIR / USER -->
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Kasir:</span>
          <span class="font-bold text-[#2b1b12]">{{ order.cashier?.name || 'Kasir' }}</span>
        </div>

        <!-- BARIS NAMA PELANGGAN / CUSTOMER -->
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Pelanggan:</span>
          <span class="font-bold text-[#2b1b12] print:text-black">{{ order.customerName || 'Pelanggan Umum' }}</span>
        </div>

        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Bayar via:</span>
          <span class="font-bold text-[#2b1b12] uppercase">{{ order.paymentMethod }}</span>
        </div>
      </div>

      <!-- RINCIAN ORDER ITEM -->
      <div class="space-y-2">
        <div class="flex justify-between items-center mono text-[0.68rem] text-[#8A7A68] print:text-black border-b border-[#2b1b12]/20 pb-1 font-bold">
          <span>ITEM</span>
          <span>TOTAL</span>
        </div>

        <div class="space-y-2">
          <div 
            v-for="item in order.orderItems" 
            :key="item.id"
            class="mono text-xs"
          >
            <!-- Nama Produk -->
            <p class="font-bold text-[#2b1b12] leading-tight">{{ item.product?.name || 'Produk' }}</p>
            
            <!-- Rincian Qty x Harga & Subtotal -->
            <div class="flex justify-between items-center text-[0.68rem] text-[#8A7A68] print:text-black mt-0.5">
              <span>{{ item.quantity }}x @{{ formatCurrency(item.price) }}</span>
              <span class="font-bold text-[#2b1b12]">
                {{ formatCurrency(Number(item.price) * item.quantity) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- TOTAL & PEMBAYARAN -->
      <div class="border-t border-dashed border-[#2b1b12]/30 pt-3 space-y-1.5 mono text-xs">
        <div v-if="Number(order.discount) > 0" class="flex justify-between text-[#8A7A68] print:text-black">
          <span>Diskon</span>
          <span>- {{ formatCurrency(order.discount) }}</span>
        </div>
        <div class="flex justify-between items-center text-sm font-bold text-[#2b1b12] pt-1 border-t border-[#2b1b12]/20">
          <span>TOTAL</span>
          <span class="display text-base font-bold text-[#2b1b12] print:text-black">{{ formatCurrency(order.totalAmount) }}</span>
        </div>
        <div v-if="order.status" class="flex justify-between text-[0.68rem] text-[#8A7A68] print:text-black pt-1">
          <span>Status</span>
          <span class="font-bold text-[#2b1b12] print:text-black">{{ order.status }}</span>
        </div>
      </div>

      <!-- CATATAN TRANSAKSI -->
      <div v-if="order.note" class="bg-[#f4eee3] print:bg-transparent p-2 rounded text-[0.68rem] mono text-[#8A7A68] print:text-black border border-[#2b1b12]/20">
        <p class="font-bold text-[#2b1b12] mb-0.5">Catatan:</p>
        <p>{{ order.note }}</p>
      </div>

      <!-- FOOTER STRUK -->
      <div class="text-center pt-3 border-t border-dashed border-[#2b1b12]/30 space-y-1">
        <p class="display text-xs font-bold text-[#2b1b12]">Terima Kasih!</p>
        <p class="mono text-[0.6rem] text-[#8A7A68] print:text-black">Simpan struk ini sebagai bukti pembayaran.</p>
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
const token = useCookie('auth_token')

const { data: response, pending, error: fetchError } = await useFetch(`/api/order/${route.params.id}`, {
  headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
})

const order = computed(() => response.value?.data || null)

// Otomatis cetak jika dibuka di dalam Iframe dan data order SUDAH siap
watch(order, (newOrder) => {
  if (newOrder && process.client) {
    if (window.self !== window.top) {
      nextTick(() => {
        setTimeout(() => {
          window.print()
        }, 300)
      })
    }
  }
}, { immediate: true })

function formatCurrency(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID')
}

function formatInvoiceNo(id) {
  if (!id) return '-'
  return String(id).padStart(6, '0')
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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

/* =========================================================
   PENGATURAN SPESIFIK PRINTER THERMAL KAFE (58mm / 80mm)
   ========================================================= */
@media print {
  @page {
    size: 58mm auto; /* Ubah ke 80mm auto jika menggunakan kertas 80mm */
    margin: 0;
  }

  html, body {
    width: 100%;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
  }

  .receipt-body {
    width: 100% !important;
    max-width: 100% !important;
    padding: 8px 4px !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  * {
    color: #000000 !important;
    text-shadow: none !important;
  }
}
</style>