<template>
  <div class="p-4 md:p-10 max-w-2xl mx-auto space-y-6 font-sans print:p-0 print:m-0 print:max-w-none">

    <!-- TOMBOL AKSI / NAVIGASI (HILANG SAAT DICETAK) -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
      <NuxtLink 
        to="/owner/pos" 
        class="mono text-xs text-[#8A7A68] hover:text-[#2b1b12] flex items-center gap-1 self-start sm:self-auto py-1"
      >
        ← Kembali ke Daftar Pesanan
      </NuxtLink>

      <div class="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
        <button 
          type="button"
          class="btn-stamp mono px-4 py-2.5 sm:py-2 text-xs w-full sm:w-auto"
          @click="printReceipt"
        >
          🖨️ CETAK STRUK
        </button>
        <NuxtLink 
          to="/owner/transaksi" 
          class="btn-stamp btn-secondary mono px-4 py-2.5 sm:py-2 text-xs w-full sm:w-auto text-center"
        >
          📋 KELOLA PESANAN
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
      <NuxtLink to="/owner/orders" class="btn-stamp mono inline-flex px-4 py-2 text-xs">
        KEMBALI KE DAFTAR PESANAN
      </NuxtLink>
    </div>

    <!-- TAMPILAN STRUK PEMBAYARAN (PRINTABLE AREA) -->
    <div v-else class="receipt-body ticket-card p-6 md:p-8 space-y-4 print:p-0 print:shadow-none print:border-none">
      
      <!-- HEADER STRUK (DINAMIS TOKO) -->
      <div class="text-center space-y-1 border-b border-dashed border-[#2b1b12]/30 print:border-black pb-3">
        <!-- LOGO TOKO (JIKA ADA) -->
        <img 
          v-if="shopSettings.logo_url" 
          :src="shopSettings.logo_url" 
          :alt="shopSettings.shop_name"
          class="w-12 h-12 object-cover rounded-full mx-auto mb-1 border border-[#2b1b12]/20 print:border-black print:w-10 print:h-10" 
        />
        
        <!-- NAMA TOKO -->
        <h1 class="display text-xl font-bold text-[#2b1b12] print:text-black uppercase tracking-wide">
          {{ shopSettings.shop_name || 'COFFEE SHOP POS' }}
        </h1>
        
        <!-- ALAMAT & HP TOKO -->
        <p v-if="shopSettings.address" class="mono text-[0.68rem] text-[#8A7A68] print:text-black leading-tight">
          {{ shopSettings.address }}
        </p>
        <p v-if="shopSettings.phone" class="mono text-[0.68rem] text-[#8A7A68] print:text-black leading-tight">
          Telp: {{ shopSettings.phone }}
        </p>
      </div>

      <!-- METADATA TRANSAKSI -->
      <div class="mono text-[0.7rem] border-b border-dashed border-[#2b1b12]/30 print:border-black pb-3 space-y-1">
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">No. Struk:</span>
          <span class="font-bold text-[#2b1b12] print:text-black">#{{ formatInvoiceNo(order.invoiceNo || order.id) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Waktu:</span>
          <span class="font-bold text-[#2b1b12] print:text-black">{{ formatDate(order.createdAt) }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Pelanggan:</span>
          <span class="font-bold text-[#2b1b12] print:text-black">{{ order.customerName || 'Pelanggan Umum' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Kasir:</span>
          <span class="font-bold text-[#2b1b12] print:text-black">{{ order.cashier?.name || order.cashierName || 'Kasir' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-[#8A7A68] print:text-black">Bayar Via:</span>
          <span class="font-bold text-[#2b1b12] print:text-black uppercase">{{ order.paymentMethod || 'CASH' }}</span>
        </div>
      </div>

      <!-- RINCIAN ORDER ITEM -->
      <div class="space-y-2">
        <div class="flex justify-between items-center mono text-[0.68rem] text-[#8A7A68] print:text-black border-b border-[#2b1b12]/20 print:border-black pb-1 font-bold">
          <span>ITEM</span>
          <span>SUBTOTAL</span>
        </div>

        <div class="space-y-2">
          <div 
            v-for="(item, idx) in itemList" 
            :key="item.id || idx"
            class="mono text-xs"
          >
            <!-- Nama Produk -->
            <p class="font-bold text-[#2b1b12] print:text-black leading-tight">{{ getItemName(item) }}</p>
            
            <!-- Rincian Qty x Harga & Subtotal -->
            <div class="flex justify-between items-center text-[0.68rem] text-[#8A7A68] print:text-black mt-0.5">
              <span>{{ getItemQty(item) }}x @{{ formatCurrency(item.price) }}</span>
              <span class="font-bold text-[#2b1b12] print:text-black">
                {{ formatCurrency(getItemQty(item) * Number(item.price || 0)) }}
              </span>
            </div>

            <!-- Catatan Per Item (Jika ada) -->
            <p v-if="item.note" class="text-[0.62rem] italic text-[#b8763c] print:text-black print:not-italic">
              * {{ item.note }}
            </p>
          </div>

          <p v-if="itemList.length === 0" class="text-xs mono text-[#8A7A68] print:text-black text-center py-2">
            Tidak ada item pesanan.
          </p>
        </div>
      </div>

      <!-- TOTAL & PEMBAYARAN -->
      <div class="border-t border-dashed border-[#2b1b12]/30 print:border-black pt-3 space-y-1.5 mono text-xs">
        <!-- Subtotal -->
        <div class="flex justify-between text-[#8A7A68] print:text-black">
          <span>Subtotal</span>
          <span>{{ formatCurrency(calculateSubtotal(order)) }}</span>
        </div>

        <!-- Diskon (Jika Ada) -->
        <div v-if="Number(order.discount) > 0" class="flex justify-between text-[#8A7A68] print:text-black">
          <span>Diskon</span>
          <span>- {{ formatCurrency(order.discount) }}</span>
        </div>

        <!-- Pajak (Jika Ada) -->
        <div v-if="Number(order.tax) > 0" class="flex justify-between text-[#8A7A68] print:text-black">
          <span>Pajak</span>
          <span>{{ formatCurrency(order.tax) }}</span>
        </div>

        <!-- Grand Total -->
        <div class="flex justify-between items-center text-sm font-bold text-[#2b1b12] print:text-black pt-1.5 border-t border-[#2b1b12]/20 print:border-black">
          <span>TOTAL</span>
          <span class="display text-base font-bold text-[#2b1b12] print:text-black">{{ formatCurrency(order.totalAmount) }}</span>
        </div>

        <!-- Status Pembayaran -->
        <div v-if="order.status" class="flex justify-between text-[0.68rem] text-[#8A7A68] print:text-black pt-1">
          <span>Status Pembayaran</span>
          <span class="font-bold text-[#2b1b12] print:text-black uppercase">{{ order.status }}</span>
        </div>
      </div>

      <!-- CATATAN TRANSAKSI -->
      <div v-if="order.note" class="bg-[#f4eee3] print:bg-transparent p-2 rounded text-[0.68rem] mono text-[#8A7A68] print:text-black border border-[#2b1b12]/20 print:border-black">
        <p class="font-bold text-[#2b1b12] print:text-black mb-0.5">Catatan Pesanan:</p>
        <p>{{ order.note }}</p>
      </div>

      <!-- FOOTER STRUK -->
      <div class="text-center pt-3 border-t border-dashed border-[#2b1b12]/30 print:border-black space-y-1">
        <p class="display text-xs font-bold text-[#2b1b12] print:text-black">TERIMA KASIH</p>
        <p class="mono text-[0.6rem] text-[#8A7A68] print:text-black">Laporan Transaksi Pemilik - POS System</p>
      </div>

    </div>

  </div>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Detail Struk (Pemilik) - POS',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

const route = useRoute()
const token = useCookie('auth_token')

// Fetch data pengaturan toko (Logo, Nama Toko, Alamat, Phone)
const { data: shopSettingsResponse } = await useFetch('/api/settings', {
  key: 'shop-settings',
  headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
})
const shopSettings = computed(() => shopSettingsResponse.value?.data || {})

// Mengambil data detail order berdasarkan ID dari route parameter
const { data: response, pending, error: fetchError } = await useFetch(`/api/order/${route.params.id}`, {
  headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
})

const order = computed(() => response.value?.data || null)

// Array item pesanan
const itemList = computed(() => {
  if (!order.value) return []
  return order.value.orderItems || order.value.items || []
})

// Otomatis cetak jika dibuka di dalam iframe / popup pencetakan
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

// Item Helpers
function getItemName(item) {
  return item.productName || item.product?.name || 'Produk'
}

function getItemQty(item) {
  return Number(item.quantity ?? item.qty) || 0
}

function calculateSubtotal(trx) {
  if (!trx) return 0
  if (trx.subtotal !== undefined && trx.subtotal !== null) {
    return Number(trx.subtotal)
  }
  return itemList.value.reduce((sum, item) => {
    return sum + (getItemQty(item) * Number(item.price || 0))
  }, 0)
}

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
   OPTIMASI KHUSUS PRINTER THERMAL STRUK POS (58mm / 80mm)
   ========================================================= */
@media print {
  @page {
    /* Gunakan 58mm auto untuk printer Panda / Xprinter / Mini POS 58mm standard, 
       atau ubah ke 80mm auto jika menggunakan printer kasir ukuran besar */
    size: 58mm auto;
    margin: 0;
  }

  /* Hilangkan margin, background, dan paksa teks berwarna hitam pekat */
  html, body {
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: 'Courier New', Courier, monospace !important; /* Standard receipt font */
  }

  /* Area Struk Mengisi Kertas Thermal */
  .receipt-body {
    width: 100% !important;
    max-width: 100% !important;
    padding: 6px 2px !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  /* Sembunyikan elemen non-cetak */
  .print\:hidden {
    display: none !important;
  }

  /* Kontras Maksimal untuk Head Printer Thermal */
  * {
    color: #000000 !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }
}
</style>