<template>
  <div class="relative">

    <!-- TOAST ALERT NOTIFICATION (CUSTOM) -->
    <Transition name="slide-fade">
      <div v-if="showAlert"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border mono text-xs"
        :class="alertType === 'success' ? 'bg-[#1c1410] text-[#faf6ee] border-[#c9793f]' : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'">
        <span class="text-base">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
        <p class="font-medium">{{ alertMessage }}</p>
      </div>
    </Transition>

    <div class="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8 font-sans">

      <!-- HEADER HALAMAN OWNER -->
      <header class="ticket-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#faf6ee]">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="mono label-xs px-2 py-0.5 rounded bg-[#c9793f] text-[#faf6ee] font-bold">PORTAL PEMILIK</span>
            <span class="mono label-xs text-[#1c1410]/60">OVERRIDE POS / KASIR DARURAT</span>
          </div>
          <h1 class="display text-xl md:text-2xl text-[#1c1410] font-bold">Pemesanan & Simulasi POS</h1>
          <p class="mono text-xs text-[#1c1410]/70 mt-0.5">Memantau dan melakukan transaksi langsung dari sudut pandang pemilik.</p>
        </div>

        <div class="flex items-center gap-3 w-full md:w-auto">
          <NuxtLink to="/owner/dashboard" class="btn-stamp-secondary mono inline-flex items-center gap-2 no-underline text-xs py-2 px-3">
            <span>← KEMBALI KE DASHBOARD</span>
          </NuxtLink>
          <div class="mono text-xs text-[#1c1410] bg-white/60 px-4 py-2 rounded border border-[#1c1410]/10 text-center flex-1 md:flex-initial">
            Keranjang: <span class="font-bold text-[#c9793f]">{{ totalCartItems }} item</span>
          </div>
        </div>
      </header>

      <!-- ERROR STATE -->
      <div v-if="fetchError" class="ticket-card p-10 text-center space-y-3 bg-[#faf6ee]">
        <p class="mono text-xs text-[#9b3a2e]">Gagal memuat katalog menu. Periksa koneksi atau coba lagi.</p>
        <button type="button" class="btn-stamp mono inline-flex px-4 py-2 text-xs" @click="refreshProducts">
          COBA LAGI
        </button>
      </div>

      <!-- UTAMA: KATALOG & KERANJANG -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        <!-- DAFTAR PRODUK (KIRI - 2 KOLOM) -->
        <section class="lg:col-span-2 space-y-4">
          <h2 class="display text-lg text-[#1c1410] font-bold">
            Katalog Menu Kafe
          </h2>

          <!-- FILTER: PENCARIAN & KATEGORI -->
          <div class="ticket-card p-4 flex flex-col sm:flex-row gap-3 bg-[#faf6ee]">
            <div class="flex-1">
              <label for="product-search-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Cari Menu</label>
              <input
                id="product-search-owner"
                v-model="searchQuery"
                type="text"
                placeholder="Ketik nama menu..."
                :disabled="pending"
                class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div class="sm:w-52">
              <label for="category-filter-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Kategori</label>
              <select
                id="category-filter-owner"
                v-model="selectedCategoryId"
                :disabled="pending"
                class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div v-for="n in itemsPerPage" :key="'sk-owner-' + n" class="ticket-card p-4 flex flex-col justify-between bg-[#faf6ee]">
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
              <div class="mt-4 pt-3 border-t border-[#1c1410]/10 flex items-center justify-between">
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
                'ticket-card p-4 flex flex-col justify-between transition group select-none bg-[#faf6ee]',
                product.stock > 0
                  ? 'hover:border-[#c9793f] cursor-pointer'
                  : 'opacity-60 bg-red-50/50 border-red-200 cursor-not-allowed'
              ]"
              @click="product.stock > 0 && addToCart(product)"
            >
              <div>
                <!-- Gambar Produk -->
                <div class="w-full h-32 rounded overflow-hidden bg-white border border-[#1c1410]/10 mb-3 flex items-center justify-center relative">
                  <img
                    v-if="product.image"
                    :src="product.image"
                    :alt="product.name"
                    class="w-full h-full object-cover"
                    :class="{ 'grayscale': product.stock <= 0 }"
                    loading="lazy"
                    @error="$event.target.style.display = 'none'"
                  />
                  <span v-else class="display text-2xl font-bold text-[#c9793f]/40">
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
                    <h3 :class="['display text-base font-bold transition', product.stock > 0 ? 'text-[#1c1410] group-hover:text-[#c9793f]' : 'text-gray-400 line-through']">
                      {{ product.name }}
                    </h3>
                    <span class="mono text-[0.65rem] text-[#1c1410]/60">{{ product.category?.name }}</span>
                  </div>

                  <!-- Badge Stok -->
                  <span :class="[
                    'mono label-xs px-2 py-0.5 rounded whitespace-nowrap font-semibold',
                    product.stock <= 0
                      ? 'bg-[#9b3a2e] text-white border border-[#9b3a2e]'
                      : (product.stock > 5 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-[#c9793f]/10 text-[#c9793f]')
                  ]">
                    {{ product.stock <= 0 ? 'HABIS' : 'Stok: ' + product.stock }}
                  </span>
                </div>

                <p class="display text-lg font-bold text-[#c9793f] mt-2">
                  {{ formatCurrency(product.price) }}
                </p>
              </div>

              <!-- Tampilan Tombol Tambah vs Status Habis -->
              <div class="mt-4 pt-3 border-t border-[#1c1410]/10 flex items-center justify-between">
                <span :class="['mono text-[0.65rem]', product.stock > 0 ? 'text-[#1c1410]/60' : 'text-[#9b3a2e] font-bold']">
                  {{ product.stock > 0 ? 'KLIK UNTUK TAMBAH' : 'TIDAK DAPAT DIPESAN' }}
                </span>
                <span :class="[
                  'w-7 h-7 rounded flex items-center justify-center font-bold text-sm transition',
                  product.stock > 0
                    ? 'bg-[#1c1410] text-[#faf6ee] group-hover:bg-[#c9793f]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
                  {{ product.stock > 0 ? '+' : '×' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="!pending && products.length === 0" class="ticket-card p-8 text-center mono text-xs text-[#1c1410]/60 bg-[#faf6ee]">
            Belum ada produk tersedia di database.
          </div>
          <div v-else-if="!pending && filteredProducts.length === 0" class="ticket-card p-8 text-center mono text-xs text-[#1c1410]/60 bg-[#faf6ee]">
            Tidak ada menu yang cocok dengan pencarian/kategori ini.
          </div>

          <!-- PAGINASI -->
          <div v-if="!pending && totalPages > 1" class="ticket-card p-3 flex items-center justify-between gap-2 bg-[#faf6ee]">
            <button
              type="button"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              class="mono label-xs px-2.5 sm:px-3 py-2 rounded border border-[#1c1410]/15 text-[#1c1410] hover:bg-[#1c1410] hover:text-[#faf6ee] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              @click="goToPage(currentPage - 1)"
            >
              ‹ <span class="hidden sm:inline ml-1">SEBELUMNYA</span>
            </button>

            <span class="sm:hidden mono label-xs text-[#1c1410]/60">
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
                    ? 'bg-[#c9793f] text-[#faf6ee]'
                    : 'text-[#1c1410]/60 hover:bg-[#1c1410]/10'
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
              class="mono label-xs px-2.5 sm:px-3 py-2 rounded border border-[#1c1410]/15 text-[#1c1410] hover:bg-[#1c1410] hover:text-[#faf6ee] transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              @click="goToPage(currentPage + 1)"
            >
              <span class="hidden sm:inline mr-1">BERIKUTNYA</span> ›
            </button>
          </div>
        </section>

        <!-- STRUK / KERANJANG BELANJA (KANAN - 1 KOLOM) -->
        <section class="space-y-4 lg:self-start lg:sticky lg:top-6">
          <h2 class="display text-lg text-[#1c1410] font-bold">
            Struk Simulasi Pemilik
          </h2>

          <div class="ticket-card p-5 md:p-6 space-y-4 bg-[#faf6ee]">
            <!-- INPUT NAMA PELANGGAN -->
            <div>
              <label for="customer-name-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Nama Pelanggan (Opsional)</label>
              <input
                id="customer-name-owner"
                v-model="customerName"
                type="text"
                placeholder="Contoh: VIP / Tamu Pemilik"
                :disabled="isProcessing"
                class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50"
              />
            </div>

            <div class="border-b border-dashed border-[#1c1410]/20 pb-3 flex justify-between items-center">
              <span class="mono label-xs text-[#1c1410]/60">ITEM PESANAN</span>
              <span class="mono label-xs text-[#1c1410]/60">SUBTOTAL</span>
            </div>

            <!-- DAFTAR ITEM DI KERANJANG -->
            <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
              <div
                v-for="(item, index) in cart"
                :key="item.id"
                class="flex justify-between items-center text-sm font-mono"
              >
                <div class="flex-1 pr-2">
                  <p class="text-[#1c1410] font-bold truncate">{{ item.name }}</p>
                  <p class="text-[0.7rem] text-[#1c1410]/60">{{ formatCurrency(item.price) }} x {{ item.quantity }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-[#1c1410]">{{ formatCurrency(item.price * item.quantity) }}</p>
                  <div class="flex items-center gap-1 justify-end mt-1">
                    <button
                      type="button"
                      :disabled="isProcessing"
                      class="px-2 py-0.5 bg-[#1c1410]/10 rounded text-xs hover:bg-[#c9793f] hover:text-white transition disabled:opacity-50"
                      aria-label="Kurangi jumlah"
                      @click.stop="decreaseQuantity(index)"
                    >-</button>
                    <button
                      type="button"
                      :disabled="isProcessing"
                      class="px-2 py-0.5 bg-[#1c1410]/10 rounded text-xs hover:bg-[#c9793f] hover:text-white transition disabled:opacity-50"
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

              <div v-if="cart.length === 0" class="text-center py-6 mono text-xs text-[#1c1410]/60">
                Keranjang masih kosong. Pilih menu di samping.
              </div>
            </div>

            <!-- RINCIAN TRANSAKSI -->
            <div class="border-t border-dashed border-[#1c1410]/20 pt-4 space-y-3">
              <div class="flex justify-between items-center">
                <span class="mono text-xs text-[#1c1410]/60">Subtotal</span>
                <span class="mono text-xs text-[#1c1410] font-bold">{{ formatCurrency(cartTotal) }}</span>
              </div>

              <!-- DISKON -->
              <div>
                <label for="order-discount-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Diskon Khusus (Rp)</label>
                <input
                  id="order-discount-owner"
                  v-model.number="discount"
                  type="number"
                  min="0"
                  :max="cartTotal"
                  placeholder="0"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50"
                />
              </div>

              <div class="flex justify-between items-center">
                <span class="mono text-xs text-[#1c1410]/60 uppercase font-bold">Total Pembayaran</span>
                <span class="display text-xl font-bold text-[#1c1410]">{{ formatCurrency(grandTotal) }}</span>
              </div>

              <!-- CATATAN -->
              <div>
                <label for="order-note-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Catatan Pesanan (Opsional)</label>
                <input
                  id="order-note-owner"
                  v-model="orderNote"
                  type="text"
                  placeholder="Contoh: Pesanan VIP Owner"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50"
                />
              </div>

              <!-- METODE PEMBAYARAN -->
              <div>
                <label for="payment-method-owner" class="mono label-xs block text-[#1c1410]/60 mb-1">Metode Pembayaran</label>
                <select
                  id="payment-method-owner"
                  v-model="paymentMethod"
                  :disabled="isProcessing"
                  class="field mono text-xs p-2 bg-white rounded border border-[#1c1410]/20 w-full focus:outline-none focus:border-[#c9793f] disabled:opacity-50"
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
              {{ isProcessing ? 'MEMPROSES TRANSAKSI…' : 'SELESAIKAN & CATAT OMZET' }}
            </button>
          </div>
        </section>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

useHead({
  title: 'Pemesanan POS - Portal Pemilik',
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

// Data Fetching
const { data: response, pending, error: fetchError, refresh: refreshProducts } = await useFetch('/api/products')
const products = computed(() => response.value?.data || [])

// State Form & Cart
const cart = ref<any[]>([])
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
  return Array.from(map.values()).sort((a: any, b: any) => a.name.localeCompare(b.name))
})

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return products.value.filter((product: any) => {
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

function goToPage(page: number) {
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

function formatCurrency(value: number) {
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

// --- Alert / Toast State ---
const alertMessage = ref('')
const alertType = ref('success')
const showAlert = ref(false)

function triggerAlert(msg: string, type = 'success') {
  alertMessage.value = msg
  alertType.value = type
  showAlert.value = true
  setTimeout(() => {
    showAlert.value = false
  }, 3000)
}

// Keranjang Actions
function addToCart(product: any) {
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

function increaseQuantity(index: number) {
  const item = cart.value[index]
  if (item.quantity < item.stock) {
    item.quantity++
  } else {
    triggerAlert('Kuantitas melebihi stok tersedia!', 'error')
  }
}

function decreaseQuantity(index: number) {
  if (cart.value[index].quantity > 1) {
    cart.value[index].quantity--
  } else {
    removeFromCart(index)
  }
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

// --- SUARA CHIME POS ---
function playSuccessSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    const osc1 = audioCtx.createOscillator()
    const gain1 = audioCtx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime)
    gain1.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
    osc1.connect(gain1)
    gain1.connect(audioCtx.destination)
    osc1.start()
    osc1.stop(audioCtx.currentTime + 0.3)

    setTimeout(() => {
      const osc2 = audioCtx.createOscillator()
      const gain2 = audioCtx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime)
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
      osc2.connect(gain2)
      gain2.connect(audioCtx.destination)
      osc2.start()
      osc2.stop(audioCtx.currentTime + 0.5)
    }, 100)
  } catch (e) {
    // Fallback
  }
}

// --- CHECKOUT PROCESS ---
async function checkout() {
  if (cart.value.length === 0 || isProcessing.value) return

  isProcessing.value = true
  checkoutError.value = ''

  try {
    const authCookie = useCookie('auth_token')
    const token = authCookie.value

    const res: any = await $fetch('/api/order', {
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
      triggerAlert(`Transaksi Owner Berhasil! ID: #${orderId}`, 'success')
      playSuccessSound()

      cart.value = []
      customerName.value = ''
      orderNote.value = ''
      discount.value = 0
      await refreshProducts()
    } else {
      checkoutError.value = 'Transaksi gagal diproses. Silakan coba lagi.'
    }
  } catch (error: any) {
    const errorMessage = error.data?.statusMessage || error.data?.message || error.message || 'Terjadi kesalahan sistem'
    checkoutError.value = 'Gagal memproses transaksi: ' + errorMessage
    await refreshProducts()
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.label-xs {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.ticket-card {
  background: #faf6ee;
  border-radius: 1rem;
  border: 1px solid rgba(28, 20, 16, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  position: relative;
}

.skeleton {
  background: linear-gradient(90deg, rgba(28, 20, 16, 0.06) 25%, rgba(28, 20, 16, 0.12) 37%, rgba(28, 20, 16, 0.06) 63%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.btn-stamp {
  background: #1c1410;
  color: #f8f5ee;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid #1c1410;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: #c9793f;
  border-color: #c9793f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 121, 63, 0.25);
}

.btn-stamp:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-stamp-secondary {
  background: transparent;
  color: #1c1410;
  border: 1px solid rgba(28, 20, 16, 0.2);
  border-radius: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  transition: all 0.2s ease;
}

.btn-stamp-secondary:hover {
  background: rgba(28, 20, 16, 0.05);
  border-color: #1c1410;
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