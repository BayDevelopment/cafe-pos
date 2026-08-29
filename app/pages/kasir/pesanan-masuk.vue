<!-- app/pages/kasir/pesanan-masuk.vue -->
<template>
  <div class="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-sans relative">
    <!-- TOAST ALERT -->
    <Transition name="slide-fade">
      <div v-if="showAlert"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border mono text-xs"
        :class="alertType === 'success'
          ? 'bg-[#2b1b12] text-[#faf6ee] border-[#b8763c]'
          : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'">
        <span class="text-base">{{ alertType === "success" ? "✅" : "⚠️" }}</span>
        <p class="font-medium">{{ alertMessage }}</p>
      </div>
    </Transition>

    <!-- HEADER -->
    <header class="ticket-card p-5 md:p-6 space-y-5">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">
              {{ isOwner ? "PEMILIK" : "KASIR" }}
            </span>
            <span class="mono label-xs text-[#8A7A68]">ANTRIAN PESANAN</span>
          </div>
          <h1 class="display text-xl sm:text-2xl text-[#2b1b12] font-bold">
            Pesanan Masuk
          </h1>
          <p class="mono text-xs text-[#8A7A68] mt-0.5">
            Pesanan dari pelanggan lewat menu — terima untuk dijadikan transaksi, atau tolak jika tidak bisa diproses.
          </p>
        </div>
        <div class="flex items-center gap-2 self-start md:self-auto">
          <span class="live-dot" :class="{ 'live-dot--syncing': pending }" />
          <span class="mono label-xs text-[#8A7A68]">
            {{ pending ? "MENYINKRONKAN..." : "LIVE · TERSAMBUNG" }}
          </span>
        </div>
      </div>

      <!-- TABS STATUS -->
      <div class="flex items-center gap-2 pt-4 border-t border-dashed border-[#2b1b12]/15">
        <button v-for="tab in tabs" :key="tab.value" type="button" class="tab-btn mono label-xs"
          :class="{ 'tab-btn--active': activeTab === tab.value }" @click="switchTab(tab.value)">
          {{ tab.label }}
          <span v-if="tab.value === 'PENDING' && pendingCount > 0" class="tab-count">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- FILTER TANGGAL -->
      <div class="pt-4 border-t border-dashed border-[#2b1b12]/15 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="mono label-xs text-[#8A7A68]">FILTER TANGGAL</span>
          <button v-if="dateFilter !== 'ALL'" type="button" class="mono label-xs text-[#9b3a2e] underline"
            @click="resetDateFilter">
            Reset filter
          </button>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button v-for="opt in dateOptions" :key="opt.value" type="button" class="chip-btn mono label-xs"
            :class="{ 'chip-btn--active': dateFilter === opt.value }" @click="selectDateOption(opt.value)">
            {{ opt.label }}
          </button>
        </div>

        <!-- RANGE KUSTOM -->
        <div v-if="dateFilter === 'CUSTOM'" class="flex items-center gap-2 flex-wrap pt-1">
          <div class="flex items-center gap-1.5">
            <label class="mono label-xs text-[#8A7A68]">DARI</label>
            <input type="date" v-model="customFrom" :max="customTo || todayStr"
              class="field mono text-xs px-2 py-1.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]" />
          </div>
          <div class="flex items-center gap-1.5">
            <label class="mono label-xs text-[#8A7A68]">SAMPAI</label>
            <input type="date" v-model="customTo" :min="customFrom" :max="todayStr"
              class="field mono text-xs px-2 py-1.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]" />
          </div>
          <p v-if="customRangeError" class="mono text-[0.65rem] text-[#9b3a2e] w-full">
            {{ customRangeError }}
          </p>
        </div>

        <p v-if="activeDateRangeLabel" class="mono text-[0.65rem] text-[#8A7A68]">
          Menampilkan pesanan: {{ activeDateRangeLabel }}
        </p>
      </div>
    </header>

    <!-- BANNER PESANAN BARU -->
    <Transition name="slide-fade">
      <button v-if="showNewOrderBanner" type="button"
        class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded border banner-new mono text-xs"
        @click="handleNewOrderBannerClick">
        <span class="flex items-center gap-2">
          <span class="pulse-dot" />
          {{ newOrderCount }} pesanan baru masuk, daftar sudah diperbarui otomatis.
        </span>
        <span class="underline shrink-0">Tutup</span>
      </button>
    </Transition>

    <!-- ERROR STATE -->
    <div v-if="fetchError && !pending" class="ticket-card p-10 text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">
        {{ fetchError?.data?.statusMessage || "Gagal memuat data pesanan. Cek koneksi internet, lalu coba lagi." }}
      </p>
      <button type="button" class="btn-stamp mono inline-flex px-4 py-2 text-xs" @click="refreshRequests">
        COBA LAGI
      </button>
    </div>

    <template v-else>
      <!-- SKELETON -->
      <div v-if="pending && !hasData" class="grid gap-3 sm:grid-cols-2">
        <div v-for="n in 4" :key="'sk-' + n" class="ticket-card p-4 space-y-3">
          <div class="flex justify-between">
            <div class="skeleton h-4 w-24 rounded"></div>
            <div class="skeleton h-4 w-16 rounded-full"></div>
          </div>
          <div class="skeleton h-3 w-32 rounded"></div>
          <div class="skeleton h-16 w-full rounded"></div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="!hasData" class="ticket-card p-10 text-center space-y-1">
        <p class="mono text-xs text-[#2b1b12] font-semibold">
          {{ emptyStateTitle }}
        </p>
        <p class="mono text-xs text-[#8A7A68]">
          {{ dateFilter === "ALL" ? "Pesanan baru dari pelanggan akan muncul otomatis di sini." : "Coba ubah rentang tanggal atau reset filter." }}
        </p>
      </div>

      <!-- GRID PESANAN -->
      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div v-for="req in requests" :key="req.id" class="ticket-card p-4 space-y-3 transition-colors"
          :class="{ 'row-new': isNew(req.id) }">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="mono font-bold text-[#2b1b12] text-sm inline-flex items-center gap-2">
                #{{ formatId(req.id) }}
                <span v-if="isNew(req.id)" class="badge badge-new">BARU</span>
              </p>
              <p class="mono text-[0.7rem] text-[#8A7A68] mt-0.5">
                {{ req.customerName || "Pelanggan (Tamu)" }} · {{ formatTimeAgo(req.createdAt) }}
              </p>
            </div>
            <span class="badge" :class="getStatusClass(req.status)">{{ getStatusLabel(req.status) }}</span>
          </div>

          <!-- RINCIAN ITEM MASING-MASING (DENGAN DISKON) -->
          <div class="space-y-2 pt-2 border-t border-dashed border-[#2b1b12]/15 max-h-40 overflow-y-auto pr-1">
            <div v-for="item in req.items" :key="item.id" class="flex justify-between items-start text-xs mono">
              <div class="space-y-0.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[#2b1b12] font-medium">{{ item.quantity }}x {{ item.productName }}</span>
                  <!-- BADGE DISKON PERSENTASE -->
                  <span v-if="item.discountPercent > 0" class="badge-discount">
                    -{{ item.discountPercent }}%
                  </span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <!-- HARGA ASLI SEBELUM DISKON (JIKA ADA) -->
                <span v-if="item.originalPrice && item.originalPrice > item.price" class="text-[0.65rem] text-[#8A7A68] line-through block leading-none">
                  {{ formatRupiah(item.originalPrice * item.quantity) }}
                </span>
                <span class="text-[#2b1b12] font-medium num">
                  {{ formatRupiah(item.subtotal || (item.price * item.quantity)) }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="req.note" class="mono text-[0.7rem] italic text-[#b8763c] pt-1">
            Catatan: {{ req.note }}
          </p>

          <!-- TOTAL & TOTAL DISKON -->
          <div class="space-y-1 pt-2 border-t border-dashed border-[#2b1b12]/15">
            <div v-if="req.totalDiscount > 0" class="flex items-center justify-between text-xs mono text-[#9b3a2e]">
              <span class="label-xs">Hemat Diskon</span>
              <span class="num font-semibold">-{{ formatRupiah(req.totalDiscount) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="mono label-xs text-[#8A7A68]">Estimasi Total</span>
              <span class="display font-bold text-[#2b1b12] num">{{ formatRupiah(req.estimatedTotal) }}</span>
            </div>
          </div>

          <div v-if="req.status === 'PENDING'" class="flex items-center gap-2 pt-1">
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs border border-[#9b3a2e]/30 text-[#9b3a2e] hover:bg-[#9b3a2e]/10 transition disabled:opacity-50"
              :disabled="processingId === req.id" @click="openRejectModal(req)">
              Tolak
            </button>
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs bg-[#2b1b12] text-[#faf6ee] font-bold hover:bg-[#b8763c] transition disabled:opacity-50"
              :disabled="processingId === req.id" @click="acceptRequest(req)">
              {{ processingId === req.id ? "MEMPROSES..." : "Terima" }}
            </button>
          </div>
        </div>
      </div>

      <!-- PAGINATION SIMPLE -->
      <div v-if="hasData && totalPages > 1" class="flex items-center justify-center gap-1.5 mono text-xs pt-1">
        <button type="button" class="page-btn" :disabled="page <= 1" @click="goToPage(page - 1)">‹ Sebelumnya</button>
        <span class="mono label-xs text-[#8A7A68] px-2">Hal {{ page }} / {{ totalPages }}</span>
        <button type="button" class="page-btn" :disabled="page >= totalPages" @click="goToPage(page + 1)">Berikutnya ›</button>
      </div>
    </template>

    <!-- MODAL TOLAK -->
    <Teleport to="body">
      <div v-if="reqToReject" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeRejectModal">
        <div class="ticket-card w-full max-w-sm p-6 space-y-4">
          <div class="space-y-1">
            <h3 class="display font-bold text-lg text-[#2b1b12]">
              Tolak Pesanan #{{ formatId(reqToReject.id) }}?
            </h3>
            <p class="mono text-xs text-[#8A7A68]">
              Pesanan ini tidak akan menjadi transaksi. Stok produk tidak akan berubah.
            </p>
          </div>

          <div class="space-y-1.5">
            <label class="mono label-xs text-[#8A7A68] block">ALASAN (opsional)</label>
            <textarea v-model="rejectReason" rows="2" maxlength="300" placeholder="Misal: stok habis, salah pesan..."
              class="field mono text-xs w-full p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 focus:outline-none focus:border-[#b8763c]"></textarea>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs border border-[#2b1b12]/20 text-[#2b1b12] hover:bg-[#2b1b12]/5 transition"
              :disabled="processingId === reqToReject.id" @click="closeRejectModal">
              Batal
            </button>
            <button type="button"
              class="flex-1 py-2 rounded mono text-xs bg-[#9b3a2e] text-[#faf6ee] font-bold hover:bg-[#7a2e24] transition disabled:opacity-50"
              :disabled="processingId === reqToReject.id" @click="confirmReject">
              {{ processingId === reqToReject.id ? "MEMPROSES..." : "TOLAK PESANAN" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"],
});

useHead({ title: "Pesanan Masuk - POS Kasir" });

const token = useCookie("auth_token");
const { user } = useAuth();

// Mengecek role dinamis
const isOwner = computed(() => user.value?.role?.toUpperCase() === "PEMILIK");

const tabs = [
  { label: "Menunggu", value: "PENDING" },
  { label: "Diterima", value: "ACCEPTED" },
  { label: "Ditolak", value: "REJECTED" },
];

const activeTab = ref("PENDING");
const page = ref(1);
const limit = 20;

function switchTab(value) {
  if (activeTab.value === value) return;
  activeTab.value = value;
  page.value = 1;
}

// --- Filter tanggal ---
const dateOptions = [
  { label: "Semua", value: "ALL" },
  { label: "Hari Ini", value: "TODAY" },
  { label: "7 Hari Terakhir", value: "7D" },
  { label: "30 Hari Terakhir", value: "30D" },
  { label: "Kustom", value: "CUSTOM" },
];

const dateFilter = ref("ALL");
const customFrom = ref("");
const customTo = ref("");
const customRangeError = ref("");

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
const todayStr = todayISO().toISOString().slice(0, 10);

function selectDateOption(value) {
  dateFilter.value = value;
  customRangeError.value = "";
  if (value !== "CUSTOM") {
    page.value = 1;
  }
}

function resetDateFilter() {
  dateFilter.value = "ALL";
  customFrom.value = "";
  customTo.value = "";
  customRangeError.value = "";
  page.value = 1;
}

const activeDateRange = computed(() => {
  const fmt = (d) => d.toISOString().slice(0, 10);
  const today = todayISO();

  if (dateFilter.value === "TODAY") {
    return { from: fmt(today), to: fmt(today) };
  }
  if (dateFilter.value === "7D") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: fmt(from), to: fmt(today) };
  }
  if (dateFilter.value === "30D") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: fmt(from), to: fmt(today) };
  }
  if (dateFilter.value === "CUSTOM") {
    if (!customFrom.value || !customTo.value) return null;
    if (customFrom.value > customTo.value) return null;
    return { from: customFrom.value, to: customTo.value };
  }
  return null;
});

watch([customFrom, customTo], ([from, to]) => {
  if (dateFilter.value !== "CUSTOM") return;
  if (from && to && from > to) {
    customRangeError.value = "Tanggal 'Dari' tidak boleh setelah tanggal 'Sampai'.";
    return;
  }
  customRangeError.value = "";
  if (from && to) page.value = 1;
});

const activeDateRangeLabel = computed(() => {
  const range = activeDateRange.value;
  if (!range) return "";
  const fmtLabel = (s) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(s));
  if (range.from === range.to) return fmtLabel(range.from);
  return `${fmtLabel(range.from)} — ${fmtLabel(range.to)}`;
});

const queryParams = computed(() => {
  const params = {
    status: activeTab.value,
    page: page.value,
    limit,
  };
  const range = activeDateRange.value;
  if (range) {
    params.startDate = range.from;
    params.endDate = range.to;
  }
  return params;
});

const {
  data: response,
  pending,
  error: fetchError,
  refresh: refreshRequests,
} = await useFetch("/api/menu/order-request", {
  key: "order-requests",
  query: queryParams,
  headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
});

const requests = computed(() => response.value?.data || []);
const hasData = computed(() => requests.value.length > 0);
const pendingCount = computed(() => response.value?.pendingCount ?? 0);
const totalPages = computed(() => response.value?.meta?.totalPages ?? 1);

const emptyStateTitle = computed(() => {
  if (dateFilter.value !== "ALL") return "Tidak ada pesanan pada rentang tanggal ini.";
  return activeTab.value === "PENDING" ? "Tidak ada pesanan yang menunggu." : "Belum ada riwayat di tab ini.";
});

function goToPage(target) {
  const clamped = Math.min(Math.max(1, target), totalPages.value);
  if (clamped !== page.value) page.value = clamped;
}

const statusMap = {
  PENDING: { label: "MENUNGGU", class: "badge-warning" },
  ACCEPTED: { label: "DITERIMA", class: "badge-success" },
  REJECTED: { label: "DITOLAK", class: "badge-danger" },
};
function getStatusLabel(status) {
  return statusMap[status]?.label || status || "-";
}
function getStatusClass(status) {
  return statusMap[status]?.class || "badge-danger";
}

function formatId(id) {
  return String(id).padStart(6, "0");
}

function formatRupiah(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// --- Deteksi pesanan baru (khusus tab PENDING, halaman 1, tanpa filter tanggal) ---
const hasInitialized = ref(false);
const newOrderMap = reactive({});
const newOrderCount = ref(0);
const showNewOrderBanner = ref(false);
let knownIds = new Set();

function isNew(id) {
  return !!newOrderMap[id];
}
function markAsNew(id) {
  newOrderMap[id] = true;
  setTimeout(() => delete newOrderMap[id], 12000);
}
function handleNewOrderBannerClick() {
  showNewOrderBanner.value = false;
  newOrderCount.value = 0;
}

watch(
  requests,
  (list) => {
    const relevant = activeTab.value === "PENDING" && page.value === 1 && dateFilter.value === "ALL";
    const currentIds = list.map((r) => r.id);

    if (!hasInitialized.value) {
      if (relevant) knownIds = new Set(currentIds);
      hasInitialized.value = true;
      return;
    }
    if (!relevant) return;

    const freshIds = currentIds.filter((id) => !knownIds.has(id));
    if (freshIds.length > 0) {
      freshIds.forEach(markAsNew);
      newOrderCount.value += freshIds.length;
      showNewOrderBanner.value = true;
    }
    knownIds = new Set(currentIds);
  },
  { immediate: true },
);

// --- Polling ---
let pollTimer = null;
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => refreshRequests(), 6000);
}
function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}
onMounted(startPolling);
onUnmounted(stopPolling);
onActivated(() => {
  refreshRequests();
  startPolling();
});
onDeactivated(stopPolling);

// --- Toast ---
const alertMessage = ref("");
const alertType = ref("success");
const showAlert = ref(false);
function triggerAlert(msg, type = "success") {
  alertMessage.value = msg;
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => (showAlert.value = false), 3000);
}

// --- Terima pesanan ---
const processingId = ref(null);

async function acceptRequest(req) {
  if (processingId.value) return;
  processingId.value = req.id;
  try {
    await $fetch(`/api/menu/order-request/${req.id}/accept`, {
      method: "POST",
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
    });
    triggerAlert(`Pesanan #${formatId(req.id)} diterima & jadi transaksi baru.`, "success");
    await refreshRequests();
  } catch (error) {
    triggerAlert(error?.data?.statusMessage || "Gagal menerima pesanan.", "error");
  } finally {
    processingId.value = null;
  }
}

// --- Tolak pesanan ---
const reqToReject = ref(null);
const rejectReason = ref("");

function openRejectModal(req) {
  reqToReject.value = req;
  rejectReason.value = "";
}
function closeRejectModal() {
  if (processingId.value) return;
  reqToReject.value = null;
  rejectReason.value = "";
}

async function confirmReject() {
  if (!reqToReject.value || processingId.value) return;
  const req = reqToReject.value;
  processingId.value = req.id;
  try {
    await $fetch(`/api/menu/order-request/${req.id}/reject`, {
      method: "POST",
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: { reason: rejectReason.value },
    });
    triggerAlert(`Pesanan #${formatId(req.id)} ditolak.`, "success");
    reqToReject.value = null;
    await refreshRequests();
  } catch (error) {
    triggerAlert(error?.data?.statusMessage || "Gagal menolak pesanan.", "error");
  } finally {
    processingId.value = null;
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

@keyframes dot-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

.tab-btn {
    padding: 0.45rem 0.85rem;
    border-radius: 5px;
    border: 1px solid rgba(43, 27, 18, 0.15);
    background: #f4eee3;
    color: #8A7A68;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.15s ease;
}

.tab-btn--active {
    background: #2b1b12;
    color: #faf6ee;
    border-color: #2b1b12;
}

.tab-count {
    background: #b8763c;
    color: #faf6ee;
    border-radius: 999px;
    padding: 0 0.4rem;
    font-size: 0.65rem;
    line-height: 1.4;
}

.chip-btn {
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    border: 1px solid rgba(43, 27, 18, 0.15);
    background: #f4eee3;
    color: #8A7A68;
    transition: all 0.15s ease;
}

.chip-btn--active {
    background: #b8763c;
    color: #faf6ee;
    border-color: #b8763c;
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
    border-left: 3px solid #b8763c;
    animation: row-glow 2s ease-in-out infinite;
}

@keyframes row-glow {
    0%, 100% { background-color: rgba(184, 118, 60, 0.14); }
    50% { background-color: rgba(184, 118, 60, 0.04); }
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

.badge-discount {
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    background: rgba(155, 58, 46, 0.12);
    color: #9b3a2e;
    border: 1px solid rgba(155, 58, 46, 0.25);
    display: inline-block;
    line-height: 1;
}

.badge-success { background: #e5efe1; color: #3f6b3f; }
.badge-danger { background: #f5e2de; color: #9b3a2e; }
.badge-warning { background: #fbf0e2; color: #7a4a1f; }
.badge-new {
    background: #b8763c;
    color: #faf6ee;
    animation: badge-pulse 1.4s ease-in-out infinite;
}

@keyframes badge-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184, 118, 60, 0.45); }
    50% { box-shadow: 0 0 0 4px rgba(184, 118, 60, 0); }
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

.page-btn {
    padding: 0.4rem 0.7rem;
    border-radius: 4px;
    border: 1px solid rgba(43, 27, 18, 0.15);
    background: #f4eee3;
    color: #2b1b12;
    transition: background 0.12s ease, opacity 0.12s ease;
}

.page-btn:hover:not(:disabled) { background: #ecdfc9; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
    transition: transform 0.12s ease, background 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
    background: #b8763c;
    border-color: #b8763c;
    transform: rotate(-0.6deg) scale(1.01);
}
</style>