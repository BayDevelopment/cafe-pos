<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated, reactive } from 'vue'

definePageMeta({
  middleware: ["auth"],
});

useHead({
  title: 'Riwayat Penjualan - POS'
})

// --- Token & Cookie Auth ---
const token = useCookie('auth_token')
const { user } = useAuth()

// --- Pengaturan Toko (untuk header struk: nama, alamat, no HP, logo) ---
const { data: shopSettingsResponse } = await useFetch('/api/settings', {
  key: 'shop-settings',
  headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
})

const shopSettings = computed(() => shopSettingsResponse.value?.data || {})

// --- Pagination & filter state ---
const page = ref(1)
const pageSize = ref(20)
const pageSizeOptions = [10, 20, 50, 100]

const searchInput = ref('')
const debouncedSearch = ref('')
const selectedStatus = ref('')
const selectedPayment = ref('')

const paymentMethodLabels = {
  CASH: "Tunai (Cash)",
  QRIS: "QRIS",
  DEBIT: "Kartu Debit",
  KREDIT: "Kartu Kredit",
  TRANSFER: "Transfer Bank",
};

const availablePaymentMethods = computed(() => {
  const set = new Set();
  rawTransactions.value.forEach((trx) => {
    if (trx.paymentMethod) set.add(trx.paymentMethod);
  });
  return Array.from(set).sort();
});

const isOwner = computed(() => {
  return user.value?.role?.toUpperCase() === "PEMILIK"
})

const statusMap = {
  PAID: { label: 'LUNAS', class: 'badge-success' },
  PENDING: { label: 'MENUNGGU', class: 'badge-warning' },
  CANCELLED: { label: 'BATAL', class: 'badge-danger' },
  REFUNDED: { label: 'REFUND', class: 'badge-danger' }
}

const NEW_PRODUCT_THRESHOLD_DAYS = 7

function isNewProductItem(item) {
  const explicitFlag = item.product?.isNew ?? item.isNew ?? item.product?.is_new
  if (typeof explicitFlag === 'boolean') return explicitFlag

  const createdAt = item.product?.createdAt || item.productCreatedAt
  if (!createdAt) return false

  const created = new Date(createdAt)
  if (isNaN(created.getTime())) return false

  const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= NEW_PRODUCT_THRESHOLD_DAYS
}

function hasNewProduct(trx) {
  const items = getItemList(trx)
  return items.some(isNewProductItem)
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status || '-'
}
function getStatusClass(status) {
  return statusMap[status]?.class || 'badge-danger'
}

let searchTimer = null
watch(searchInput, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val.trim()
  }, 350)
})

const isFilteringActive = computed(() =>
  !!debouncedSearch.value || !!selectedStatus.value || !!selectedPayment.value
)

watch([debouncedSearch, selectedStatus, selectedPayment], () => {
  page.value = 1
})
watch(pageSize, () => {
  page.value = 1
})

function clearFilters() {
  searchInput.value = ''
  debouncedSearch.value = ''
  selectedStatus.value = ''
  selectedPayment.value = ''
}

// --- Data Fetching dengan Header Authorization ---
const queryParams = computed(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value || undefined,
  status: selectedStatus.value || undefined,
  paymentMethod: selectedPayment.value || undefined
}))

const { data: response, pending, error: fetchError, refresh: refreshTransactions } = await useFetch(
  '/api/transactions',
  {
    key: 'transactions-list',
    query: queryParams,
    headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
  }
)

const rawTransactions = computed(() => response.value?.data || [])

// Multi-field Client-Side Search Fallback
const filteredTransactions = computed(() => {
  const query = debouncedSearch.value.toLowerCase()
  if (!query) return rawTransactions.value

  return rawTransactions.value.filter((trx) => {
    const invoiceStr = String(trx.invoiceNo || trx.id || '').toLowerCase()
    const customerStr = String(trx.customerName || 'pelanggan umum').toLowerCase()
    const cashierStr = String(trx.cashier?.name || trx.cashierName || '').toLowerCase()
    const paymentStr = String(trx.paymentMethod || '').toLowerCase()

    return (
      invoiceStr.includes(query) ||
      customerStr.includes(query) ||
      cashierStr.includes(query) ||
      paymentStr.includes(query)
    )
  })
})

const transactions = computed(() => filteredTransactions.value)
const hasData = computed(() => transactions.value.length > 0)

const metaData = computed(() => response.value?.meta || {})
const totalItems = computed(() =>
  metaData.value.total ?? metaData.value.totalItems ?? response.value?.total ?? transactions.value.length
)
const totalPages = computed(() =>
  Math.max(1, metaData.value.totalPages ?? metaData.value.last_page ?? Math.ceil(totalItems.value / pageSize.value))
)

const noDataAtAll = computed(() => !pending.value && totalItems.value === 0 && !isFilteringActive.value)

const rangeStart = computed(() => (totalItems.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const rangeEnd = computed(() => Math.min(page.value * pageSize.value, totalItems.value))

const skeletonCount = computed(() => Math.min(pageSize.value, 10))

function goToPage(target) {
  const clamped = Math.min(Math.max(1, target), totalPages.value)
  if (clamped !== page.value) page.value = clamped
}

const pageWindow = computed(() => {
  const total = totalPages.value
  const current = page.value
  const delta = 1
  const range = []
  const withDots = []
  let last

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }
  range.forEach((i) => {
    if (last) {
      if (i - last === 2) withDots.push(last + 1)
      else if (i - last > 2) withDots.push('...')
    }
    withDots.push(i)
    last = i
  })
  return withDots
})

// --- Deteksi & Highlight Pesanan Baru ---
const hasInitialized = ref(false)
const newOrderMap = reactive({})
const newOrderCount = ref(0)
const showNewOrderBanner = ref(false)
let knownIds = new Set()
let pollTimer = null

function isNew(id) {
  return !!newOrderMap[id]
}

function markAsNew(id) {
  newOrderMap[id] = true
  setTimeout(() => {
    delete newOrderMap[id]
  }, 12000)
}

function dismissNewOrderBanner() {
  showNewOrderBanner.value = false
  newOrderCount.value = 0
}

function handleNewOrderBannerClick() {
  if (page.value > 1) {
    clearFilters()
    goToPage(1)
  }
  dismissNewOrderBanner()
}

watch(transactions, (list) => {
  const onFirstPageUnfiltered = page.value === 1 && !isFilteringActive.value
  const currentIds = list.map(t => t.id)

  if (!hasInitialized.value) {
    if (onFirstPageUnfiltered) knownIds = new Set(currentIds)
    hasInitialized.value = true
    return
  }

  if (!onFirstPageUnfiltered) return

  const freshIds = currentIds.filter(id => !knownIds.has(id))
  if (freshIds.length > 0) {
    freshIds.forEach(markAsNew)
    newOrderCount.value += freshIds.length
    showNewOrderBanner.value = true
  }
  knownIds = new Set(currentIds)
}, { immediate: true })

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(() => {
    refreshTransactions()
  }, 8000)
}
function stopPolling() {
  clearInterval(pollTimer)
  pollTimer = null
}

onMounted(startPolling)
onUnmounted(stopPolling)
onActivated(() => {
  refreshTransactions()
  startPolling()
})
onDeactivated(stopPolling)

// --- Ringkasan Statistik ---
const summary = computed(() => {
  if (response.value?.summary) {
    return { ...response.value.summary, scopedToPage: false }
  }
  const successTrx = transactions.value.filter(t => t.status === 'PAID')
  const totalAmount = successTrx.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0)
  const successCount = successTrx.length
  const average = successCount > 0 ? Math.round(totalAmount / successCount) : 0
  return { totalAmount, successCount, average, scopedToPage: true }
})

// --- Detail Modal State ---
const selectedTrx = ref(null)

function openDetailModal(trx) {
  selectedTrx.value = trx
}
function closeDetailModal() {
  selectedTrx.value = null
}

// --- Alert / Toast State ---
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

// --- Hapus Transaksi ---
const trxToDelete = ref(null)
const isDeleting = ref(false)

function confirmDelete(trx) {
  trxToDelete.value = trx
}

async function deleteTransaction() {
  if (!trxToDelete.value) return
  isDeleting.value = true

  const idToDelete = trxToDelete.value.id

  try {
    await $fetch(`/api/transactions/${idToDelete}`, {
      method: 'DELETE',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
    })

    trxToDelete.value = null
    triggerAlert('Riwayat transaksi berhasil dihapus!', 'success')

    if (transactions.value.length === 1 && page.value > 1) {
      page.value -= 1
    } else {
      await clearNuxtData('transactions-list')
      await refreshTransactions()
    }
  } catch (err) {
    triggerAlert(err?.data?.statusMessage || 'Gagal menghapus transaksi.', 'error')
  } finally {
    isDeleting.value = false
  }
}

// --- Edit Transaksi State & Handlers (Khusus Owner / Sesuai Kebutuhan) ---
const trxToEdit = ref(null)
const isSavingEdit = ref(false)
const editError = ref('')

const editForm = reactive({
  status: 'PENDING',
  paymentMethod: 'CASH',
  customerName: '',
  note: '',
  discount: 0,
})

function openEditModal(trx) {
  editError.value = ''
  editForm.status = trx.status || 'PENDING'
  editForm.paymentMethod = trx.paymentMethod || 'CASH'
  editForm.customerName = trx.customerName || ''
  editForm.note = trx.note || ''
  editForm.discount = Number(trx.discount || 0)
  trxToEdit.value = trx
}

function closeEditModal() {
  if (isSavingEdit.value) return
  trxToEdit.value = null
  editError.value = ''
}

async function submitEditTransaction() {
  if (!trxToEdit.value || isSavingEdit.value) return
  isSavingEdit.value = true
  editError.value = ''

  const payload = {
    status: editForm.status,
    paymentMethod: editForm.paymentMethod,
    customerName: editForm.customerName,
    note: editForm.note,
    discount: editForm.discount,
  }

  try {
    await $fetch(`/api/transactions/${trxToEdit.value.id}`, {
      method: 'PATCH',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: payload,
    })

    triggerAlert('Transaksi berhasil diperbarui', 'success')
    trxToEdit.value = null
    await refreshTransactions()
  } catch (error) {
    editError.value = error?.data?.statusMessage || 'Gagal memperbarui transaksi.'
  } finally {
    isSavingEdit.value = false
  }
}

// --- Formatters & Item Helpers ---
function formatInvoiceNo(id) {
  if (!id) return '-'
  return String(id).padStart(6, '0')
}

function getItemList(trx) {
  if (!trx) return []
  return trx.orderItems || trx.items || []
}

function getItemName(item) {
  return item.productName || item.product?.name || 'Produk'
}

function getItemQty(item) {
  return Number(item.quantity ?? item.qty) || 0
}

function calculateSubtotal(trx) {
  if (trx.subtotal !== undefined && trx.subtotal !== null) {
    return Number(trx.subtotal)
  }
  const items = getItemList(trx)
  return items.reduce((sum, item) => {
    return sum + (getItemQty(item) * Number(item.price || 0))
  }, 0)
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
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-sans relative">

    <!-- TOAST ALERT NOTIFICATION -->
    <Transition name="slide-fade">
      <div v-if="showAlert"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border mono text-xs"
        :class="alertType === 'success' ? 'bg-[#2b1b12] text-[#faf6ee] border-[#b8763c]' : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'">
        <span class="text-base">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
        <p class="font-medium">{{ alertMessage }}</p>
      </div>
    </Transition>

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-5 md:p-6 space-y-5">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">{{ isOwner ? "PEMILIK" : "KASIR" }}</span>
            <span class="mono label-xs text-[#8A7A68]">RIWAYAT PENJUALAN</span>
          </div>
          <h1 class="display text-xl sm:text-2xl text-[#2b1b12] font-bold">Daftar Transaksi</h1>
          <p class="mono text-xs text-[#8A7A68] mt-0.5">Pantau dan kelola semua histori pembayaran pelanggan.</p>
        </div>

        <div class="flex items-center gap-2 self-start md:self-auto">
          <span class="live-dot" :class="{ 'live-dot--syncing': pending }" />
          <span class="mono label-xs text-[#8A7A68]">
            {{ pending ? 'MENYINKRONKAN...' : 'LIVE · TERSAMBUNG' }}
          </span>
        </div>
      </div>

      <!-- RINGKASAN STRUK GAYA SUB-TOTAL -->
      <div v-if="hasData"
        class="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-dashed border-[#2b1b12]/15 transition-opacity"
        :class="{ 'opacity-50': pending }">
        <div class="stat-box">
          <p class="mono label-xs text-[#8A7A68]">
            Total Penjualan{{ summary.scopedToPage ? ' (halaman ini)' : '' }}
          </p>
          <p class="display font-bold text-[#2b1b12] text-sm sm:text-lg num">{{ formatRupiah(summary.totalAmount) }}</p>
        </div>
        <div class="stat-box">
          <p class="mono label-xs text-[#8A7A68]">Transaksi Selesai{{ summary.scopedToPage ? ' (halaman ini)' : '' }}
          </p>
          <p class="display font-bold text-[#2b1b12] text-sm sm:text-lg num">{{ summary.successCount }}</p>
        </div>
        <div class="stat-box">
          <p class="mono label-xs text-[#8A7A68]">Rata-rata / Transaksi</p>
          <p class="display font-bold text-[#2b1b12] text-sm sm:text-lg num">{{ formatRupiah(summary.average) }}</p>
        </div>
      </div>
    </header>

    <!-- BANNER PESANAN BARU -->
    <Transition name="slide-fade">
      <button v-if="showNewOrderBanner" type="button"
        class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded border banner-new mono text-xs"
        @click="handleNewOrderBannerClick">
        <span class="flex items-center gap-2">
          <span class="pulse-dot" />
          {{ newOrderCount }} pesanan baru masuk{{ page > 1 ? ' — lihat di Halaman 1' : ', daftar sudah diperbarui otomatis.' }}
        </span>
        <span class="underline shrink-0">{{ page > 1 ? 'Ke Halaman 1' : 'Tutup' }}</span>
      </button>
    </Transition>

    <!-- FILTER & PENCARIAN -->
    <div class="ticket-card p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
      <div class="relative w-full sm:w-80">
        <input v-model="searchInput" type="text" placeholder="Cari ID, Pelanggan, atau Kasir..." :disabled="noDataAtAll"
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed" />
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        <select v-model="selectedStatus" :disabled="noDataAtAll"
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
          <option value="">Semua Status</option>
          <option value="PAID">Lunas</option>
          <option value="PENDING">Menunggu</option>
          <option value="CANCELLED">Dibatalkan</option>
          <option value="REFUNDED">Refund</option>
        </select>

        <select v-model="selectedPayment" :disabled="noDataAtAll"
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
          <option value="">Semua Pembayaran</option>
          <option v-for="method in availablePaymentMethods" :key="method" :value="method">
            {{ paymentMethodLabels[method] || method }}
          </option>
        </select>

        <select v-model.number="pageSize" :disabled="noDataAtAll"
          class="field mono text-xs p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} / halaman</option>
        </select>

        <button v-if="isFilteringActive" type="button"
          class="mono label-xs text-[#b8763c] hover:underline whitespace-nowrap px-1" @click="clearFilters">
          Reset filter
        </button>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-if="fetchError && !pending" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">
        {{ fetchError?.data?.statusMessage || 'Gagal memuat data transaksi. Cek koneksi internet, lalu coba lagi.' }}
      </p>
      <button type="button" class="btn-stamp mono inline-flex px-4 py-2 text-xs" @click="refreshTransactions">
        COBA LAGI
      </button>
    </div>

    <template v-else>
      <!-- SKELETON (desktop / tablet) -->
      <div v-if="pending" class="ticket-card overflow-hidden hidden md:block">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
              <th class="mono label-xs text-[#8A7A68] px-5 py-3">ID Transaksi</th>
              <th class="mono label-xs text-[#8A7A68] px-5 py-3">Waktu</th>
              <th class="mono label-xs text-[#8A7A68] px-5 py-3">Pelanggan</th>
              <th class="mono label-xs text-[#8A7A68] px-5 py-3">Metode</th>
              <th class="mono label-xs text-[#8A7A68] px-5 py-3">Status</th>
              <th class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Total</th>
              <th class="mono label-xs text-center text-[#8A7A68] px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2b1b12]/5">
            <tr v-for="n in skeletonCount" :key="'sk-' + n">
              <td class="px-5 py-4">
                <div class="skeleton h-4 w-20 rounded"></div>
              </td>
              <td class="px-5 py-4">
                <div class="skeleton h-4 w-24 rounded"></div>
              </td>
              <td class="px-5 py-4">
                <div class="skeleton h-4 w-24 rounded"></div>
              </td>
              <td class="px-5 py-4">
                <div class="skeleton h-4 w-16 rounded"></div>
              </td>
              <td class="px-5 py-4">
                <div class="skeleton h-4 w-16 rounded-full"></div>
              </td>
              <td class="px-5 py-4 text-right">
                <div class="skeleton h-4 w-20 rounded ml-auto"></div>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="skeleton h-5 w-12 rounded mx-auto"></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- SKELETON (mobile) -->
      <div v-if="pending" class="space-y-3 md:hidden">
        <div v-for="n in skeletonCount" :key="'sk-m-' + n" class="ticket-card p-4 space-y-3">
          <div class="flex justify-between">
            <div class="skeleton h-4 w-28 rounded"></div>
            <div class="skeleton h-4 w-14 rounded-full"></div>
          </div>
          <div class="skeleton h-3 w-32 rounded"></div>
          <div class="flex justify-between pt-2 border-t border-dashed border-[#2b1b12]/15">
            <div class="skeleton h-3 w-20 rounded"></div>
            <div class="skeleton h-4 w-16 rounded"></div>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="!hasData" class="ticket-card p-10 text-center space-y-1">
        <template v-if="isFilteringActive">
          <p class="mono text-xs text-[#2b1b12] font-semibold">Tidak ada transaksi yang cocok.</p>
          <p class="mono text-xs text-[#8A7A68]">Coba ubah kata kunci atau filter yang digunakan.</p>
          <button type="button" class="mono label-xs text-[#b8763c] hover:underline mt-2" @click="clearFilters">
            Reset filter
          </button>
        </template>
        <template v-else>
          <p class="mono text-xs text-[#2b1b12] font-semibold">Belum ada transaksi.</p>
          <p class="mono text-xs text-[#8A7A68]">Transaksi akan muncul otomatis di sini begitu pembayaran berhasil.</p>
        </template>
      </div>

      <template v-else>
        <!-- TABEL TRANSAKSI (desktop / tablet) -->
        <main class="ticket-card overflow-hidden hidden md:block">
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
                  <th scope="col" class="mono label-xs text-center text-[#8A7A68] px-5 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#2b1b12]/5">
                <tr v-for="trx in filteredTransactions" :key="trx.id" class="transition-colors"
                  :class="isNew(trx.id) ? 'row-new' : 'hover:bg-[#f4eee3]/50'">
                  <td class="px-5 py-4 mono font-bold text-[#2b1b12]">
                    <span class="inline-flex items-center gap-2">
                      #{{ formatInvoiceNo(trx.invoiceNo || trx.id) }}
                      <span v-if="isNew(trx.id)" class="badge badge-new">BARU</span>
                      <span v-if="hasNewProduct(trx)" class="badge badge-new-product"
                        title="Transaksi ini mengandung produk baru">
                        PRODUK BARU
                      </span>
                    </span>
                  </td>
                  <td class="px-5 py-4 mono text-xs text-[#8A7A68]">
                    {{ formatDate(trx.createdAt) }}
                  </td>
                  <td class="px-5 py-4 mono text-xs text-[#2b1b12] font-semibold">
                    {{ trx.customerName || 'Pelanggan Umum' }}
                  </td>
                  <td class="px-5 py-4">
                    <span
                      class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12]/5 text-[#2b1b12] border border-[#2b1b12]/10 uppercase">
                      {{ trx.paymentMethod || '-' }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    <span class="badge" :class="getStatusClass(trx.status)">{{ getStatusLabel(trx.status) }}</span>
                  </td>
                  <td class="px-5 py-4 text-right display font-bold text-[#2b1b12] num">
                    {{ formatRupiah(trx.totalAmount) }}
                  </td>
                  <td class="px-5 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <!-- ICON DETAIL -->
                      <button type="button"
                        class="p-1.5 rounded text-[#2b1b12] hover:text-[#b8763c] hover:bg-[#2b1b12]/5 transition"
                        title="Lihat Detail Transaksi" @click="openDetailModal(trx)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      <!-- ICON EDIT (Opsional/Owner) -->
                      <button v-if="isOwner" type="button"
                        class="p-1.5 rounded text-[#2b1b12] hover:text-[#b8763c] hover:bg-[#2b1b12]/5 transition"
                        title="Edit Transaksi" @click="openEditModal(trx)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <!-- ICON DELETE / HAPUS -->
                      <button type="button" class="p-1.5 rounded text-[#9b3a2e] hover:bg-[#9b3a2e]/10 transition"
                        title="Hapus Transaksi" @click="confirmDelete(trx)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor" stroke-width="1.8">
                          <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        <!-- KARTU TRANSAKSI (mobile) -->
        <main class="space-y-3 md:hidden">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="ticket-card w-full text-left p-4 space-y-2.5"
            :class="{ 'row-new': isNew(trx.id) }">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="mono font-bold text-[#2b1b12] text-sm inline-flex items-center gap-2">
                  #{{ formatInvoiceNo(trx.invoiceNo || trx.id) }}
                  <span v-if="isNew(trx.id)" class="badge badge-new">BARU</span>
                </p>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-0.5">
                  Pelanggan: <span class="font-semibold text-[#2b1b12]">{{ trx.customerName || 'Pelanggan Umum'
                    }}</span>
                </p>
              </div>

              <div class="flex items-center gap-2">
                <span class="badge" :class="getStatusClass(trx.status)">{{ getStatusLabel(trx.status) }}</span>

                <!-- TOMBOL ACTION MOBILE -->
                <button type="button" class="p-1 rounded text-[#2b1b12] hover:text-[#b8763c] transition-colors"
                  title="Lihat Detail" @click="openDetailModal(trx)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>

                <button v-if="isOwner" type="button" class="p-1 rounded text-[#2b1b12] hover:text-[#b8763c] transition-colors"
                  title="Edit Transaksi" @click="openEditModal(trx)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button type="button" class="p-1 rounded text-[#9b3a2e] hover:bg-[#9b3a2e]/10 transition-colors"
                  title="Hapus Transaksi" @click="confirmDelete(trx)">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-dashed border-[#2b1b12]/15">
              <div class="mono text-xs text-[#8A7A68] space-y-0.5">
                <p>{{ formatDate(trx.createdAt) }}</p>
                <p class="uppercase font-semibold text-[#2b1b12]">{{ trx.paymentMethod || '-' }}</p>
              </div>
              <p class="display font-bold text-[#2b1b12] num">{{ formatRupiah(trx.totalAmount) }}</p>
            </div>
          </div>
        </main>

        <!-- PAGINATION -->
        <div class="ticket-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="mono label-xs text-[#8A7A68]">
            Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ totalItems.toLocaleString('id-ID') }} transaksi
          </p>

          <div class="flex items-center gap-1.5 mono text-xs">
            <button type="button" class="page-btn" :disabled="page <= 1" @click="goToPage(page - 1)">
              ‹ Sebelumnya
            </button>

            <template v-for="(item, idx) in pageWindow" :key="idx">
              <span v-if="item === '...'" class="px-1.5 text-[#8A7A68]">...</span>
              <button v-else type="button" class="page-btn page-btn--num" :class="{ 'page-btn--active': item === page }"
                @click="goToPage(item)">
                {{ item }}
              </button>
            </template>

            <button type="button" class="page-btn" :disabled="page >= totalPages" @click="goToPage(page + 1)">
              Berikutnya ›
            </button>
          </div>
        </div>
      </template>
    </template>

    <!-- MODAL CONFIRM DELETE -->
    <Teleport to="body">
      <div v-if="trxToDelete"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="trxToDelete = null">
        <div class="ticket-card w-full max-w-sm p-6 space-y-4">
          <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-full bg-[#9b3a2e]/10 text-[#9b3a2e] flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="display font-bold text-lg text-[#2b1b12]">Hapus Transaksi?</h3>
            <p class="mono text-xs text-[#8A7A68]">
              Apakah Anda yakin ingin menghapus transaksi <span class="font-bold text-[#2b1b12]">#{{
                formatInvoiceNo(trxToDelete.invoiceNo || trxToDelete.id)
              }}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs border border-[#2b1b12]/20 text-[#2b1b12] hover:bg-[#2b1b12]/5 transition"
              :disabled="isDeleting" @click="trxToDelete = null">
              Batal
            </button>
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs bg-[#9b3a2e] text-[#faf6ee] font-bold hover:bg-[#7a2e24] transition disabled:opacity-50"
              :disabled="isDeleting" @click="deleteTransaction">
              {{ isDeleting ? 'MENGHAPUS...' : 'HAPUS' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL EDIT TRANSAKSI -->
    <Teleport to="body">
      <div v-if="trxToEdit"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeEditModal">
        <div class="ticket-card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          <div>
            <h3 class="display font-bold text-lg text-[#2b1b12]">
              Edit Transaksi #{{ formatInvoiceNo(trxToEdit.invoiceNo || trxToEdit.id) }}
            </h3>
            <p class="mono text-xs text-[#8A7A68] mt-1">
              Perbarui status, metode pembayaran, atau rincian transaksi.
            </p>
          </div>

          <form @submit.prevent="submitEditTransaction" class="space-y-3.5">
            <div class="space-y-1.5">
              <label class="mono label-xs text-[#8A7A68] block">STATUS</label>
              <select v-model="editForm.status"
                class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]">
                <option value="PENDING">Menunggu</option>
                <option value="PAID">Lunas</option>
                <option value="CANCELLED">Dibatalkan</option>
                <option value="REFUNDED">Refund</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="mono label-xs text-[#8A7A68] block">METODE PEMBAYARAN</label>
              <select v-model="editForm.paymentMethod"
                class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]">
                <option v-for="(label, key) in paymentMethodLabels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="mono label-xs text-[#8A7A68] block">NAMA PELANGGAN</label>
              <input v-model="editForm.customerName" type="text" maxlength="100" placeholder="Pelanggan Umum"
                class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]" />
            </div>

            <div class="space-y-1.5">
              <label class="mono label-xs text-[#8A7A68] block">CATATAN</label>
              <textarea v-model="editForm.note" rows="2" maxlength="300"
                class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]"></textarea>
            </div>

            <div class="space-y-1.5 pt-2 border-t border-dashed border-[#2b1b12]/15">
              <label class="mono label-xs text-[#8A7A68] block">DISKON (Rp)</label>
              <input v-model.number="editForm.discount" type="number" min="0" step="500"
                class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]" />
            </div>

            <p v-if="editError" class="mono text-xs text-[#9b3a2e]">{{ editError }}</p>

            <div class="flex items-center gap-2 pt-2">
              <button type="button"
                class="flex-1 py-2 rounded mono text-xs border border-[#2b1b12]/20 text-[#2b1b12] hover:bg-[#2b1b12]/5 transition"
                :disabled="isSavingEdit" @click="closeEditModal">
                Batal
              </button>
              <button type="submit"
                class="flex-1 py-2 rounded mono text-xs bg-[#2b1b12] text-[#faf6ee] font-bold hover:bg-[#b8763c] transition disabled:opacity-50"
                :disabled="isSavingEdit">
                {{ isSavingEdit ? "MENYIMPAN..." : "SIMPAN PERUBAHAN" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL DETAIL TRANSAKSI & STRUK -->
    <Teleport to="body">
      <div v-if="selectedTrx"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeDetailModal">
        <div class="ticket-card receipt-card w-full max-w-md p-6 pb-8 space-y-5">

          <!-- HEADER STRUK -->
          <div class="text-center border-b border-dashed border-[#2b1b12]/20 pb-4">
            <img v-if="shopSettings.logo_url" :src="shopSettings.logo_url" :alt="shopSettings.shop_name"
              class="w-10 h-10 object-cover rounded-full mx-auto mb-1.5 border border-[#2b1b12]/15" />
            <h2 class="display text-xl text-[#2b1b12] font-bold uppercase">{{ shopSettings.shop_name || 'COFFEE SHOP POS' }}</h2>
            <p v-if="shopSettings.address" class="mono text-[0.68rem] text-[#8A7A68] mt-0.5">{{ shopSettings.address }}</p>
            <p v-if="shopSettings.phone" class="mono text-[0.68rem] text-[#8A7A68]">{{ shopSettings.phone }}</p>

            <p class="mono text-xs text-[#8A7A68] mt-2 pt-2 border-t border-dotted border-[#2b1b12]/10">
              Struk Pembayaran #{{ formatInvoiceNo(selectedTrx.invoiceNo || selectedTrx.id) }}
            </p>
            <p class="mono label-xs text-[#8A7A68] mt-1">{{ formatDate(selectedTrx.createdAt) }}</p>

            <!-- INFORMASI PELANGGAN & KASIR -->
            <div
              class="mt-3 pt-2 border-t border-dotted border-[#2b1b12]/10 flex justify-between text-xs mono text-[#2b1b12]">
              <div class="text-left">
                <span class="text-[#8A7A68] text-[0.65rem] block uppercase">Pelanggan:</span>
                <span class="font-bold">{{ selectedTrx.customerName || 'Pelanggan Umum' }}</span>
              </div>
              <div class="text-right">
                <span class="text-[#8A7A68] text-[0.65rem] block uppercase">Kasir:</span>
                <span class="font-bold">
                  {{ selectedTrx.cashier?.name || selectedTrx.cashierName || 'Kasir' }}
                </span>
              </div>
            </div>
          </div>

          <!-- RINCIAN ITEM -->
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            <div v-for="(item, index) in getItemList(selectedTrx)" :key="item.id || index"
              class="flex justify-between items-start text-xs mono">
              <div>
                <p class="font-bold text-[#2b1b12]">{{ getItemName(item) }}</p>
                <p class="text-[#8A7A68] num">
                  {{ getItemQty(item) }}x @{{ formatRupiah(item.price) }}
                </p>
                <p v-if="item.note" class="text-[0.65rem] italic text-[#b8763c]">
                  Catatan: {{ item.note }}
                </p>
              </div>
              <p class="font-bold text-[#2b1b12] num">
                {{ formatRupiah(getItemQty(item) * Number(item.price || 0)) }}
              </p>
            </div>

            <p v-if="!getItemList(selectedTrx) || getItemList(selectedTrx).length === 0"
              class="text-xs mono text-[#8A7A68] text-center py-2">
              Tidak ada rincian item.
            </p>
          </div>

          <!-- TOTAL & PEMBAYARAN -->
          <div class="border-t border-dashed border-[#2b1b12]/20 pt-4 space-y-1.5 mono text-xs">
            <!-- Subtotal -->
            <div class="flex justify-between text-[#8A7A68]">
              <span>Subtotal</span>
              <span class="num">{{ formatRupiah(calculateSubtotal(selectedTrx)) }}</span>
            </div>

            <!-- Diskon (Jika Ada) -->
            <div v-if="Number(selectedTrx.discount) > 0" class="flex justify-between text-[#8A7A68]">
              <span>Diskon</span>
              <span class="num text-[#9b3a2e]">- {{ formatRupiah(selectedTrx.discount) }}</span>
            </div>

            <!-- Pajak (Jika Ada) -->
            <div v-if="Number(selectedTrx.tax) > 0" class="flex justify-between text-[#8A7A68]">
              <span>Pajak</span>
              <span class="num">{{ formatRupiah(selectedTrx.tax) }}</span>
            </div>

            <!-- Grand Total -->
            <div class="flex justify-between text-sm font-bold text-[#2b1b12] pt-1 border-t border-[#2b1b12]/10">
              <span>TOTAL</span>
              <span class="num display text-base">{{ formatRupiah(selectedTrx.totalAmount) }}</span>
            </div>

            <!-- Metode Pembayaran -->
            <div class="flex justify-between text-[#8A7A68] pt-1">
              <span>Metode Pembayaran</span>
              <span class="font-bold uppercase text-[#2b1b12]">{{ selectedTrx.paymentMethod || 'CASH' }}</span>
            </div>

            <!-- Catatan Transaksi -->
            <div v-if="selectedTrx.note" class="pt-2 text-[0.68rem] text-[#8A7A68]">
              <span class="font-bold block text-[#2b1b12]">Catatan Pesanan:</span>
              <p class="italic bg-[#f4eee3] p-1.5 rounded border border-[#2b1b12]/10 mt-0.5">{{ selectedTrx.note }}</p>
            </div>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="flex items-center gap-3 pt-2">
            <NuxtLink :to="`/owner/order/${selectedTrx.id}`" class="btn-stamp mono flex-1 py-2.5 text-xs text-center">
              🖨️ LIHAT STRUK
            </NuxtLink>
            <button type="button" class="mono text-xs text-[#8A7A68] hover:text-[#2b1b12] px-4 py-2.5 transition"
              @click="closeDetailModal">
              Tutup
            </button>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>

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

.stat-box {
  background: #f4eee3;
  border: 1px solid rgba(43, 27, 18, 0.08);
  border-radius: 5px;
  padding: 0.6rem 0.5rem;
  text-align: center;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #4a7c4a;
  box-shadow: 0 0 0 3px rgba(74, 124, 74, 0.18);
  flex-shrink: 0;
}

.live-dot--syncing {
  background: #b8763c;
  box-shadow: 0 0 0 3px rgba(184, 118, 60, 0.18);
  animation: dot-pulse 1s ease-in-out infinite;
}

.badge-warning {
  background: #fbf0e2;
  color: #b8763c;
}

@keyframes dot-pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.banner-new {
  background: #fbf0e2;
  border-color: rgba(184, 118, 60, 0.35);
  color: #7a4a1f;
  cursor: pointer;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #b8763c;
  display: inline-block;
  animation: dot-pulse 1s ease-in-out infinite;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.row-new {
  background: rgba(184, 118, 60, 0.1);
  animation: row-glow 2.2s ease-in-out 3;
}

@keyframes row-glow {

  0%,
  100% {
    background-color: rgba(184, 118, 60, 0.12);
  }

  50% {
    background-color: rgba(184, 118, 60, 0.04);
  }
}

.badge-new-product {
  background: #eef3e9;
  color: #4a7c4a;
  font-size: 0.6rem;
  padding: 0.15rem 0.4rem;
  animation: badge-pulse-green 1.6s ease-in-out infinite;
}

@keyframes badge-pulse-green {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(74, 124, 74, 0.4);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(74, 124, 74, 0);
  }
}

.badge {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.badge-success {
  background: #e5efe1;
  color: #3f6b3f;
}

.badge-danger {
  background: #f5e2de;
  color: #9b3a2e;
}

.badge-new {
  background: #b8763c;
  color: #faf6ee;
}

.skeleton {
  background: linear-gradient(90deg, #efe7d8 25%, #f7f1e6 37%, #efe7d8 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

.page-btn {
  padding: 0.4rem 0.7rem;
  border-radius: 4px;
  border: 1px solid rgba(43, 27, 18, 0.15);
  background: #f4eee3;
  color: #2b1b12;
  transition: background 0.12s ease, opacity 0.12s ease;
}

.page-btn:hover:not(:disabled) {
  background: #ecdfc9;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn--num {
  min-width: 2.1rem;
  text-align: center;
}

.page-btn--active {
  background: #2b1b12;
  color: #faf6ee;
  border-color: #2b1b12;
}

.receipt-card::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -9px;
  height: 18px;
  background:
    linear-gradient(135deg, #faf6ee 25%, transparent 25%) 0 0,
    linear-gradient(225deg, #faf6ee 25%, transparent 25%) 0 0;
  background-size: 18px 18px;
  background-repeat: repeat-x;
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.14));
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