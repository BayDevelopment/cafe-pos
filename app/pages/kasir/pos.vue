<template>
  <div class="relative">

    <!-- TOAST ALERT NOTIFICATION (CUSTOM) -->
    <Transition name="slide-fade">
      <div v-if="showAlert"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border mono text-xs"
        :class="alertType === 'success' ? 'bg-[#2b1b12] text-[#faf6ee] border-[#b8763c]' : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'">
        <span class="text-base">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
        <p class="font-medium">{{ alertMessage }}</p>
      </div>
    </Transition>

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

      <!-- ERROR STATE -->
      <div v-if="fetchError" class="ticket-card p-10 text-center space-y-3">
        <p class="mono text-xs text-[#9b3a2e]">Gagal memuat katalog menu. Periksa koneksi atau coba lagi.</p>
        <button type="button" class="btn-stamp mono inline-flex px-4 py-2 text-xs" @click="refreshProducts">
          COBA LAGI
        </button>
      </div>

      <!-- UTAMA: KATALOG & KERANJANG -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        <!-- DAFTAR PRODUK (KIRI - 2 KOLOM) -->
        <section class="lg:col-span-2 space-y-4">
          <h2 class="display text-lg text-[#2b1b12] font-bold">
            Daftar Menu Tersedia
          </h2>

          <!-- FILTER: PENCARIAN & KATEGORI -->
          <div class="ticket-card p-4 flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <label for="product-search" class="mono label-xs block text-[#8A7A68] mb-1">Cari Menu</label>
              <input
                id="product-search"
                v-model="searchQuery"
                type="text"
                placeholder="Ketik nama menu..."
                :disabled="pending"
                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div class="sm:w-52">
              <label for="category-filter" class="mono label-xs block text-[#8A7A68] mb-1">Kategori</label>
              <select
                id="category-filter"
                v-model="selectedCategoryId"
                :disabled="pending"
                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ALL">Semua Kategori</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- SKELETON KATALOG (loading) -->
          <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-for="n in itemsPerPage" :key="'sk-' + n" class="ticket-card p-4 flex flex-col justify-between">
              <div>
                <div class="skeleton w-full h-32 rounded mb-3"></div>
                <div class="flex justify-between items-start gap-2 mb-2">
                  <div class="space-y-1.5 flex-1">
                    <div class="skeleton h-4 w-3/4 rounded"></div>
                    <div class="skeleton h-3 w-1/3 rounded"></div>
                  </div>
                  <div class="skeleton h-4 w-14 rounded-full shrink-0"></div>
                </div>
                <div class="skeleton h-5 w-24 rounded mt-2"></div>
              </div>
              <div class="mt-4 pt-3 border-t border-[#2b1b12]/10 flex items-center justify-between">
                <div class="skeleton h-3 w-28 rounded"></div>
                <div class="skeleton w-7 h-7 rounded"></div>
              </div>
            </div>
          </div>

          <!-- KATALOG PRODUK -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="product in paginatedProducts"
              :key="product.id"
              :class="[
                'ticket-card p-4 flex flex-col justify-between transition group select-none',
                product.stock > 0
                  ? 'hover:border-[#b8763c] cursor-pointer'
                  : 'opacity-60 bg-red-50/50 border-red-200 cursor-not-allowed'
              ]"
              @click="product.stock > 0 && addToCart(product)"
            >
              <div>
                <!-- Gambar Produk -->
                <div class="w-full h-32 rounded overflow-hidden bg-[#f4eee3] border border-[#2b1b12]/10 mb-3 flex items-center justify-center relative">
                  <img
                    v-if="product.image"
                    :src="product.image"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                    :class="{ 'grayscale': product.stock <= 0 }"
                    loading="lazy"
                    @error="$event.target.style.display = 'none'"
                  />
                  <span v-else class="display text-2xl font-bold text-[#b8763c]/40">
                    {{ product.name?.charAt(0).toUpperCase() }}
                  </span>

                  <!-- Overlay Badge saat Stok Habis -->
                  <span
                    v-if="product.stock <= 0"
                    class="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] flex items-center justify-center font-bold text-white tracking-widest text-xs uppercase"
                  >
                    STOK HABIS
                  </span>
                </div>

                <div class="flex justify-between items-start gap-2 mb-2">
                  <div>
                    <h3 :class="['display text-base font-bold transition', product.stock > 0 ? 'text-[#2b1b12] group-hover:text-[#b8763c]' : 'text-gray-400 line-through']">
                      {{ product.name }}
                    </h3>
                    <span class="mono text-[0.65rem] text-[#8A7A68]">{{ product.category?.name }}</span>
                  </div>

                  <!-- Badge Stok -->
                  <span :class="[
                    'mono label-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold',
                    product.stock <= 0
                      ? 'bg-[#9b3a2e] text-white border border-[#9b3a2e]'
                      : (product.stock > 5 ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#b8763c]/10 text-[#b8763c]')
                  ]">
                    {{ product.stock <= 0 ? 'HABIS' : 'Stok: ' + product.stock }}
                  </span>
                </div>

                <p class="display text-lg font-bold text-[#b8763c] mt-2">
                  {{ formatCurrency(product.price) }}
                </p>
              </div>

              <!-- Tampilan Tombol Tambah vs Status Habis -->
              <div class="mt-4 pt-3 border-t border-[#2b1b12]/10 flex items-center justify-between">
                <span :class="['mono text-[0.65rem]', product.stock > 0 ? 'text-[#8A7A68]' : 'text-[#9b3a2e] font-bold']">
                  {{ product.stock > 0 ? 'KLIK UNTUK TAMBAH' : 'TIDAK DAPAT DIPESAN' }}
                </span>
                <span :class="[
                  'w-7 h-7 rounded flex items-center justify-center font-bold text-sm transition',
                  product.stock > 0
                    ? 'bg-[#2b1b12] text-[#faf6ee] group-hover:bg-[#b8763c]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
                  {{ product.stock > 0 ? '+' : '×' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!pending && products.length === 0" class="ticket-card p-8 text-center mono text-xs text-[#8A7A68]">
            Belum ada produk tersedia di database.
          </div>
          <div v-else-if="!pending && filteredProducts.length === 0" class="ticket-card p-8 text-center mono text-xs text-[#8A7A68]">
            Tidak ada menu yang cocok dengan pencarian/kategori ini.
          </div>

          <!-- PAGINASI -->
          <div v-if="!pending && totalPages > 1" class="ticket-card p-3 flex items-center justify-between gap-2">
            <button
              type="button"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              class="mono label-xs px-2.5 sm:px-3 py-2 rounded border border-[#2b1b12]/15 text-[#2b1b12] hover:bg-[#2b1b12] hover:text-[#faf6ee] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              @click="goToPage(currentPage - 1)"
            >
              ‹ <span class="hidden sm:inline ml-1">SEBELUMNYA</span>
            </button>

            <span class="sm:hidden mono label-xs text-[#8A7A68]">
              HAL {{ currentPage }} / {{ totalPages }}
            </span>

            <div class="hidden sm:flex items-center gap-1.5 flex-wrap justify-center">
              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                :class="[
                  'mono label-xs w-8 h-8 rounded transition shrink-0',
                  page === currentPage
                    ? 'bg-[#b8763c] text-[#faf6ee]'
                    : 'text-[#8A7A68] hover:bg-[#2b1b12]/10'
                ]"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              type="button"
              :disabled="currentPage === totalPages"
              aria-label="Halaman berikutnya"
              class="mono label-xs px-2.5 sm:px-3 py-2 rounded border border-[#2b1b12]/15 text-[#2b1b12] hover:bg-[#2b1b12] hover:text-[#faf6ee] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              @click="goToPage(currentPage + 1)"
            >
              <span class="hidden sm:inline mr-1">BERIKUTNYA</span> ›
            </button>
          </div>
        </section>

        <!-- STRUK / KERANJANG BELANJA (KANAN - 1 KOLOM) -->
        <section class="space-y-4 lg:self-start lg:sticky lg:top-6">
          <h2 class="display text-lg text-[#2b1b12] font-bold">
            Struk Pesanan
          </h2>

          <div class="ticket-card p-5 md:p-6 space-y-4">
            <!-- INPUT NAMA PELANGGAN -->
            <div>
              <label for="customer-name" class="mono label-xs block text-[#8A7A68] mb-1">Nama Pelanggan (Opsional)</label>
              <input
                id="customer-name"
                v-model="customerName"
                type="text"
                placeholder="Contoh: Budi / Meja 05"
                :disabled="isProcessing"
                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50"
              />
            </div>

            <div class="border-b border-dashed border-[#2b1b12]/20 pb-3 flex justify-between items-center">
              <span class="mono label-xs text-[#8A7A68]">ITEM PESANAN</span>
              <span class="mono label-xs text-[#8A7A68]">SUBTOTAL</span>
            </div>

            <!-- DAFTAR ITEM DI KERANJANG -->
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
                      :disabled="isProcessing"
                      class="px-2 py-0.5 bg-[#2b1b12]/10 rounded text-xs hover:bg-[#b8763c] hover:text-white transition disabled:opacity-50"
                      aria-label="Kurangi jumlah"
                      @click.stop="decreaseQuantity(index)"
                    >-</button>
                    <button
                      type="button"
                      :disabled="isProcessing"
                      class="px-2 py-0.5 bg-[#2b1b12]/10 rounded text-xs hover:bg-[#b8763c] hover:text-white transition disabled:opacity-50"
                      aria-label="Tambah jumlah"
                      @click.stop="increaseQuantity(index)"
                    >+</button>
                    <button
                      type="button"
                      :disabled="isProcessing"
                      class="text-[#9b3a2e] text-xs ml-1 hover:underline disabled:opacity-50"
                      @click.stop="removeFromCart(index)"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>

              <div v-if="cart.length === 0" class="text-center py-6 mono text-xs text-[#8A7A68]">
                Keranjang masih kosong. Pilih menu di samping.
              </div>
            </div>

            <!-- RINCIAN TRANSAKSI -->
            <div class="border-t border-dashed border-[#2b1b12]/20 pt-4 space-y-3">
              <div class="flex justify-between items-center">
                <span class="mono text-xs text-[#8A7A68]">Subtotal</span>
                <span class="mono text-xs text-[#2b1b12] font-bold">{{ formatCurrency(cartTotal) }}</span>
              </div>

              <!-- DISKON -->
              <div>
                <label for="order-discount" class="mono label-xs block text-[#8A7A68] mb-1">Diskon (Rp)</label>
                <input
                  id="order-discount"
                  v-model.number="discount"
                  type="number"
                  min="0"
                  :max="cartTotal"
                  placeholder="0"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50"
                />
              </div>

              <div class="flex justify-between items-center">
                <span class="mono text-xs text-[#8A7A68] uppercase font-bold">Total Pembayaran</span>
                <span class="display text-xl font-bold text-[#2b1b12]">{{ formatCurrency(grandTotal) }}</span>
              </div>

              <!-- CATATAN -->
              <div>
                <label for="order-note" class="mono label-xs block text-[#8A7A68] mb-1">Catatan Pesanan (Opsional)</label>
                <input
                  id="order-note"
                  v-model="orderNote"
                  type="text"
                  placeholder="Contoh: Tanpa gula, es sedikit"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50"
                />
              </div>

              <!-- METODE PEMBAYARAN -->
              <div>
                <label for="payment-method" class="mono label-xs block text-[#8A7A68] mb-1">Metode Pembayaran</label>
                <select
                  id="payment-method"
                  v-model="paymentMethod"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50"
                >
                  <option value="CASH">TUNAI (CASH)</option>
                  <option value="QRIS">QRIS / DIGITAL</option>
                  <option value="DEBIT">KARTU DEBIT</option>
                  <option value="KREDIT">KARTU KREDIT</option>
                  <option value="TRANSFER">TRANSFER BANK</option>
                </select>
              </div>
            </div>

            <!-- PESAN ERROR CHECKOUT -->
            <p v-if="checkoutError" class="mono text-xs text-[#9b3a2e] bg-red-100/60 p-2 rounded border border-red-200">
              {{ checkoutError }}
            </p>

            <!-- TOMBOL PROSES (ANTI DOUBLE-CLICK SENSITIF) -->
            <button
              type="button"
              :disabled="cart.length === 0 || isProcessing"
              class="btn-stamp mono w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              @click="checkout"
            >
              <span v-if="isProcessing" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ isProcessing ? 'MEMPROSES TRANSAKSI…' : 'SELESAIKAN & CETAK STRUK' }}
            </button>
          </div>
        </section>

      </div>

    </div>
  </div>
</template>

<script setup>
useHead({
  title: 'Pemesanan Kasir - POS System',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

// Data Fetching
const { data: response, pending, error: fetchError, refresh: refreshProducts } = await useFetch('/api/products')
const products = computed(() => response.value?.data || [])

// State Form & Cart
const cart = ref([])
const customerName = ref('')
const paymentMethod = ref('CASH')
const orderNote = ref('')
const discount = ref(0)
const isProcessing = ref(false)
const checkoutError = ref('')

// State Filter
const searchQuery = ref('')
const selectedCategoryId = ref('ALL')

const categories = computed(() => {
  const map = new Map()
  for (const product of products.value) {
    if (product.category && !map.has(product.category.id)) {
      map.set(product.category.id, product.category)
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return products.value.filter(product => {
    const matchesSearch = !query || product.name.toLowerCase().includes(query)
    const matchesCategory = selectedCategoryId.value === 'ALL' || product.categoryId === selectedCategoryId.value
    return matchesSearch && matchesCategory
  })
})

// Pagination
const itemsPerPage = 6
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage)))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredProducts.value.slice(start, start + itemsPerPage)
})

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

watch([searchQuery, selectedCategoryId], () => {
  currentPage.value = 1
})

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = newTotal || 1
  }
})

function formatCurrency(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID')
}

const totalCartItems = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0))

const normalizedDiscount = computed(() => {
  const d = Number(discount.value) || 0
  if (d < 0) return 0
  if (d > cartTotal.value) return cartTotal.value
  return d
})

const grandTotal = computed(() => cartTotal.value - normalizedDiscount.value)

// --- Alert / Toast State (Custom, menggantikan SweetAlert2) ---
const alertMessage = ref('')
const alertType = ref('success') // 'success' | 'error'
const showAlert = ref(false)

function triggerAlert(msg, type = 'success') {
  alertMessage.value = msg
  alertType.value = type
  showAlert.value = true
  setTimeout(() => {
    showAlert.value = false
  }, 3000)
}

// Keranjang Actions
function addToCart(product) {
  if (product.stock <= 0) return

  const existingIndex = cart.value.findIndex(item => item.id === product.id)
  if (existingIndex > -1) {
    const currentQty = cart.value[existingIndex].quantity
    if (currentQty < product.stock) {
      cart.value[existingIndex].quantity++
    } else {
      triggerAlert('Kuantitas melebihi stok tersedia!', 'error')
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
    triggerAlert('Kuantitas melebihi stok tersedia!', 'error')
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

// --- SUARA CHIME POS JERNIH & MELODIS (WEB AUDIO API) ---
function playSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    // Tone 1
    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime) // Note E5
    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start()
    osc1.stop(audioCtx.currentTime + 0.3)

    // Tone 2 (Chime)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime) // Note B5
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start()
      osc2.stop(audioCtx.currentTime + 0.5)
    }, 100)
  } catch (e) {
    // Fallback jika browser memblokir Web Audio Context
  }
}

// --- CHECKOUT PROCESS (DENGAN PERLINDUNGAN ANTI DOUBLE-CLICK) ---
async function checkout() {
  // Guard 1: Cegah jika keranjang kosong atau proses transaksi sedang berjalan (Anti Double Click)
  if (cart.value.length === 0 || isProcessing.value) return

  // Kunci tombol checkout secara mendadak
  isProcessing.value = true
  checkoutError.value = ''

  try {
    const authCookie = useCookie('auth_token')
    const token = authCookie.value

    const res = await $fetch('/api/order', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        items: cart.value.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        customerName: customerName.value || null,
        paymentMethod: paymentMethod.value,
        totalAmount: grandTotal.value,
        discount: normalizedDiscount.value,
        note: orderNote.value || null
      }
    })

    if (res && res.success && res.orderId) {
      const orderId = res.orderId

      // 1. Alert Toast (Custom, menggantikan Swal)
      triggerAlert(`Pembelian berhasil! ID Transaksi: #${orderId}`, 'success')

      // 2. Play Audio Chime Jernih
      playSuccessSound()

      // 3. Reset Form & Refresh Data Stok
      cart.value = []
      customerName.value = ''
      orderNote.value = ''
      discount.value = 0
      await refreshProducts()
    } else {
      checkoutError.value = 'Transaksi gagal diproses. Silakan coba lagi.'
    }
  } catch (error) {
    const errorMessage = error.data?.statusMessage || error.data?.message || error.message || 'Terjadi kesalahan sistem'
    checkoutError.value = 'Gagal memproses transaksi: ' + errorMessage

    // Jika error disebabkan oleh stok habis di server, refresh produk otomatis
    await refreshProducts()
  } finally {
    // Buka kembali kuncian setelah seluruh proses selesai
    isProcessing.value = false
  }
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
  border: 1.5px solid rgba(43, 27, 18, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  position: relative;
}

.skeleton {
  background: linear-gradient(90deg, #efe7d8 25%, #f7f1e6 37%, #efe7d8 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}
@keyframes skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
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
.btn-stamp:disabled { opacity: 0.55; cursor: not-allowed; }

.dot-spin {
  width: 12px;
  height: 12px;
  border: 2px solid #faf6ee;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* TOAST TRANSITION */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>