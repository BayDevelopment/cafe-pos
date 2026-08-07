<!-- app/pages/kasir/pos.vue -->
<template>
  <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">TRANSAKSI</span>
          <span class="mono label-xs text-[#8A7A68]">POINT OF SALE</span>
        </div>
        <h1 class="display text-xl md:text-2xl text-[#2b1b12] font-bold">Pemesanan Kasir</h1>
        <p class="mono text-xs text-[#8A7A68] mt-0.5">Pilih menu pesanan pelanggan dari daftar di bawah.</p>
      </div>

      <div class="mono text-xs text-[#2b1b12] bg-[#f4eee3] px-4 py-2 rounded border border-[#2b1b12]/10 w-full md:w-auto text-center">
        Total Item di Keranjang: <span class="font-bold text-[#b8763c]">{{ totalCartItems }}</span>
      </div>
    </header>

    <!-- LOADING STATE -->
    <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68]">
      MEMUAT KATALOG MENU...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">Gagal memuat katalog menu. Periksa koneksi atau coba lagi.</p>
      <button type="button" class="btn-stamp mono inline-flex px-4 py-2 text-xs" @click="refreshProducts">
        COBA LAGI
      </button>
    </div>

    <!-- UTAMA: KATALOG & KERANJANG -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

      <!-- DAFTAR PRODUK (KIRI - 2 KOLOM) -->
      <section class="lg:col-span-2 space-y-4">
        <h2 class="display text-lg text-[#2b1b12] font-bold flex items-center gap-2">
          <span>☕</span> Daftar Menu Tersedia
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            v-for="product in products" 
            :key="product.id"
            :class="[
              'ticket-card p-5 flex flex-col justify-between transition group cursor-pointer',
              product.stock > 0 ? 'hover:border-[#b8763c]' : 'opacity-60 cursor-not-allowed'
            ]"
            @click="product.stock > 0 && addToCart(product)"
          >
            <div>
              <div class="flex justify-between items-start gap-2 mb-2">
                <h3 class="display text-base text-[#2b1b12] font-bold group-hover:text-[#b8763c] transition">
                  {{ product.name }}
                </h3>
                <span :class="['mono label-xs px-2 py-0.5 rounded whitespace-nowrap', product.stock > 5 ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#9b3a2e]/10 text-[#9b3a2e]']">
                  Stok: {{ product.stock }}
                </span>
              </div>
              <p class="display text-lg font-bold text-[#b8763c] mt-2">
                {{ formatCurrency(product.price) }}
              </p>
            </div>

            <div class="mt-4 pt-3 border-t border-[#2b1b12]/10 flex items-center justify-between">
              <span class="mono text-[0.65rem] text-[#8A7A68]">
                {{ product.stock > 0 ? 'KLIK UNTUK TAMBAH' : 'STOK HABIS' }}
              </span>
              <span class="w-7 h-7 rounded bg-[#2b1b12] text-[#faf6ee] flex items-center justify-center font-bold text-sm group-hover:bg-[#b8763c] transition">
                +
              </span>
            </div>
          </div>
        </div>

        <div v-if="products.length === 0" class="ticket-card p-8 text-center mono text-xs text-[#8A7A68]">
          Belum ada produk tersedia di database.
        </div>
      </section>

      <!-- STRUK / KERANJANG BELANJA (KANAN - 1 KOLOM) -->
      <section class="space-y-4">
        <h2 class="display text-lg text-[#2b1b12] font-bold flex items-center gap-2">
          <span>🧾</span> Struk Pesanan
        </h2>

        <div class="ticket-card p-5 md:p-6 space-y-4 sticky top-6">
          <div class="border-b border-dashed border-[#2b1b12]/20 pb-3 flex justify-between items-center">
            <span class="mono label-xs text-[#8A7A68]">ITEM PESANAN</span>
            <span class="mono label-xs text-[#8A7A68]">SUBTOTAL</span>
          </div>

          <!-- Daftar Item di Keranjang -->
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div 
              v-for="(item, index) in cart" 
              :key="item.id"
              class="flex justify-between items-center text-sm font-mono"
            >
              <div class="flex-1 pr-2">
                <p class="text-[#2b1b12] font-bold truncate">{{ item.name }}</p>
                <p class="text-[0.7rem] text-[#8A7A68]">{{ formatCurrency(item.price) }} x {{ item.quantity }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-[#2b1b12]">{{ formatCurrency(item.price * item.quantity) }}</p>
                <div class="flex items-center gap-1 justify-end mt-1">
                  <button 
                    type="button"
                    class="px-2 py-0.5 bg-[#2b1b12]/10 rounded text-xs hover:bg-[#b8763c] hover:text-white transition"
                    aria-label="Kurangi jumlah"
                    @click.stop="decreaseQuantity(index)"
                  >-</button>
                  <button 
                    type="button"
                    class="px-2 py-0.5 bg-[#2b1b12]/10 rounded text-xs hover:bg-[#b8763c] hover:text-white transition"
                    aria-label="Tambah jumlah"
                    @click.stop="increaseQuantity(index)"
                  >+</button>
                  <button 
                    type="button"
                    class="text-[#9b3a2e] text-xs ml-1 hover:underline"
                    @click.stop="removeFromCart(index)"
                  >Hapus</button>
                </div>
              </div>
            </div>

            <div v-if="cart.length === 0" class="text-center py-6 mono text-xs text-[#8A7A68]">
              Keranjang masih kosong. Pilih menu di samping.
            </div>
          </div>

          <!-- Input Rincian Transaksi -->
          <div class="border-t border-dashed border-[#2b1b12]/20 pt-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="mono text-xs text-[#8A7A68] uppercase font-bold">Total Pembayaran</span>
              <span class="display text-xl font-bold text-[#2b1b12]">{{ formatCurrency(cartTotal) }}</span>
            </div>

            <!-- Catatan Pesanan (Disimpan ke model Order.note) -->
            <div>
              <label for="order-note" class="mono label-xs block text-[#8A7A68] mb-1">Catatan Pesanan (Opsional)</label>
              <input 
                id="order-note"
                v-model="orderNote"
                type="text" 
                placeholder="Contoh: Tanpa gula, es sedikit"
                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]" 
              />
            </div>

            <!-- Metode Pembayaran (Disimpan ke model Order.paymentMethod) -->
            <div>
              <label for="payment-method" class="mono label-xs block text-[#8A7A68] mb-1">Metode Pembayaran</label>
              <select 
                id="payment-method"
                v-model="paymentMethod"
                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]"
              >
                <option value="CASH">TUNAI (CASH)</option>
                <option value="QRIS">QRIS / DIGITAL</option>
              </select>
            </div>
          </div>

          <!-- Pesan Error Checkout -->
          <p v-if="checkoutError" class="mono text-xs text-[#9b3a2e]">{{ checkoutError }}</p>

          <!-- Tombol Proses Transaksi -->
          <button 
            type="button"
            :disabled="cart.length === 0 || isProcessing"
            class="btn-stamp mono w-full mt-2"
            @click="checkout"
          >
            <span v-if="isProcessing" class="dot-spin" aria-hidden="true"></span>
            {{ isProcessing ? 'MEMPROSES TRANSAKSI…' : 'SELESAIKAN & CETAK STRUK' }}
          </button>
        </div>
      </section>

    </div>

  </div>
</template>

<script setup>
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

const router = useRouter()

// Ambil data produk
const { data: response, pending, error: fetchError, refresh: refreshProducts } = await useFetch('/api/products')
const products = computed(() => response.value?.data || [])

// State Keranjang & Form
const cart = ref([])
const paymentMethod = ref('CASH')
const orderNote = ref('')
const isProcessing = ref(false)
const checkoutError = ref('')

function formatCurrency(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID')
}

const totalCartItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0))

function addToCart(product) {
  if (product.stock <= 0) return

  const existingIndex = cart.value.findIndex(item => item.id === product.id)
  if (existingIndex > -1) {
    if (cart.value[existingIndex].quantity < product.stock) {
      cart.value[existingIndex].quantity++
    } else {
      alert('Kuantitas melebihi stok yang tersedia!')
    }
  } else {
    cart.value.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock
    })
  }
}

function increaseQuantity(index) {
  const item = cart.value[index]
  if (item.quantity < item.stock) {
    item.quantity++
  } else {
    alert('Kuantitas melebihi stok yang tersedia!')
  }
}

function decreaseQuantity(index) {
  if (cart.value[index].quantity > 1) {
    cart.value[index].quantity--
  } else {
    removeFromCart(index)
  }
}

function removeFromCart(index) {
  cart.value.splice(index, 1)
}

async function checkout() {
  if (cart.value.length === 0) return

  isProcessing.value = true
  checkoutError.value = ''

  try {
    const res = await $fetch('/api/orders', {
      method: 'POST',
      body: {
        items: cart.value.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: paymentMethod.value,
        totalAmount: cartTotal.value,
        note: orderNote.value || null
      }
    })

    if (res.success && res.orderId) {
      // Redirect ke halaman cetak/detail struk pesanan di area kasir
      router.push(`/kasir/order/${res.orderId}`)
    } else {
      checkoutError.value = 'Transaksi gagal diproses. Silakan coba lagi.'
    }
  } catch (error) {
    checkoutError.value = 'Gagal memproses transaksi: ' + (error.data?.message || error.message)
  } finally {
    isProcessing.value = false
  }
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
  transition: transform 0.12s ease, background 0.15s ease;
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

.dot-spin {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(250, 246, 238, 0.35);
  border-top-color: #faf6ee;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>