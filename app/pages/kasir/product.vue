<!-- app/pages/kasir/produk.vue -->
<template>
  <div
    class="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-['Poppins',sans-serif] relative"
  >
    <!-- TOAST ALERT NOTIFICATION (CUSTOM) -->
    <Transition name="slide-fade">
      <div
        v-if="showAlert"
        class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-xs"
        :class="
          alertType === 'success'
            ? 'bg-[#2b1b12] text-[#faf6ee] border-[#b8763c]'
            : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'
        "
      >
        <span class="text-base">{{
          alertType === "success" ? "✅" : "⚠️"
        }}</span>
        <p class="font-medium">{{ alertMessage }}</p>
      </div>
    </Transition>

    <!-- HEADER -->
    <div
      class="ticket-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span
            class="label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee] font-medium text-[10px] tracking-wider"
            >MANAJEMEN</span
          >
          <span
            class="label-xs text-[#8A7A68] text-[10px] font-medium tracking-wider"
            >DATA PRODUK</span
          >
        </div>
        <h1 class="text-xl md:text-2xl text-[#2b1b12] font-bold tracking-tight">
          Daftar Produk
        </h1>
        <p class="text-xs text-[#8A7A68] mt-0.5">
          Kelola menu, harga, stok, dan kategori toko.
        </p>
      </div>

      <button
        v-if="isOwner"
        @click="openForm(null, categories)"
        class="btn-stamp px-4 py-2.5 text-xs w-full md:w-auto flex items-center justify-center gap-2 font-semibold"
      >
        <span class="text-sm font-bold">＋</span> TAMBAH PRODUK
      </button>
    </div>

    <!-- FILTER & SEARCH -->
    <div class="ticket-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label
          class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
          >Cari Produk</label
        >
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nama produk atau SKU..."
          class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:border-[#b8763c] outline-none font-normal"
        />
      </div>

      <div>
        <label
          class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
          >Filter Kategori</label
        >
        <select
          v-model="selectedCategory"
          class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none font-normal"
        >
          <option value="">Semua Kategori</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div>
        <label
          class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
          >Filter Status</label
        >
        <select
          v-model="selectedStatus"
          class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none font-normal"
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- SKELETON LOADING -->
    <div v-if="pending" class="ticket-card overflow-hidden">
      <div class="p-6 text-center text-xs text-[#8A7A68]">
        Memuat data produk...
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
      <p class="text-xs text-[#9b3a2e] font-medium">
        Gagal memuat data produk.
      </p>
      <button
        @click="refreshProducts"
        class="btn-stamp inline-flex px-4 py-2 text-xs font-semibold"
      >
        COBA LAGI
      </button>
    </div>

    <!-- TABEL PRODUK -->
    <div v-else class="ticket-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Info Produk
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Kategori
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Harga
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Stok
              </th>
              <th
                class="text-xs font-semibold text-center text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="text-xs font-semibold text-right text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="product in products"
              :key="product.id"
              class="border-b border-[#2b1b12]/5 last:border-0 hover:bg-[#f4eee3]/50 transition"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="product.image"
                    :src="product.image"
                    :alt="product.name"
                    class="w-10 h-10 object-cover rounded border border-[#2b1b12]/10"
                  />
                  <div
                    v-else
                    class="w-10 h-10 bg-[#2b1b12]/10 rounded flex items-center justify-center text-[#8A7A68] text-xs font-bold"
                  >
                    IMG
                  </div>
                  <div>
                    <p class="font-bold text-[#2b1b12] text-sm">
                      {{ product.name }}
                    </p>
                    <p v-if="product.sku" class="text-[10px] text-[#8A7A68]">
                      SKU: {{ product.sku }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-[#2b1b12] font-medium">
                {{ product.category?.name || "-" }}
              </td>
              <td class="px-5 py-4 text-[#2b1b12] font-semibold text-sm">
                {{ formatCurrency(product.price) }}
                <div
                  v-if="product.costPrice"
                  class="text-[10px] text-[#8A7A68] font-normal"
                >
                  Modal: {{ formatCurrency(product.costPrice) }}
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  :class="[
                    'text-xs px-2.5 py-1 rounded font-semibold inline-block',
                    product.stock > 5
                      ? 'bg-[#2f7a46]/10 text-[#2f7a46]'
                      : 'bg-[#9b3a2e]/10 text-[#9b3a2e]',
                  ]"
                >
                  {{ product.stock }} Pcs
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded font-semibold inline-block',
                    product.isActive
                      ? 'bg-[#2f7a46]/10 text-[#2f7a46]'
                      : 'bg-[#8A7A68]/10 text-[#8A7A68]',
                  ]"
                >
                  {{ product.isActive ? "AKTIF" : "NONAKTIF" }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="isOwner"
                    @click="openForm(product, categories)"
                    title="Edit Product"
                    class="p-2 rounded-lg bg-[#b8763c]/10 text-[#b8763c] hover:bg-[#b8763c] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      ></path>
                      <path
                        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      ></path>
                    </svg>
                  </button>

                  <!-- Tombol Hapus: HANYA MUNCUL JIKA ROLE ADALAH PEMILIK -->
                  <button
                    v-if="isOwner"
                    @click="confirmDelete(product)"
                    title="Hapus Product"
                    class="p-2 rounded-lg bg-[#9b3a2e]/10 text-[#9b3a2e] hover:bg-[#9b3a2e] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="6" class="p-10 text-center text-xs text-[#8A7A68]">
                Produk tidak ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION CONTROLS -->
      <div
        class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#2b1b12]/10 bg-[#f4eee3]/30"
      >
        <span class="text-xs text-[#8A7A68]">
          Halaman
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.currentPage
          }}</strong>
          dari
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.totalPages || 1
          }}</strong>
          (Total
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.totalItems
          }}</strong>
          Produk)
        </span>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-xs bg-[#f4eee3] hover:bg-[#e8decb] border border-[#2b1b12]/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-[#2b1b12] transition font-semibold"
          >
            ← Sebelumnya
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage >= (pagination.totalPages || 1)"
            class="px-3 py-1.5 text-xs bg-[#f4eee3] hover:bg-[#e8decb] border border-[#2b1b12]/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-[#2b1b12] transition font-semibold"
          >
            Berikutnya →
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL FORM -->
    <Teleport to="body">
      <div
        v-if="isFormOpen"
        class="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-start justify-center py-10 font-['Poppins',sans-serif]"
        @click.self="closeForm"
      >
        <div
          class="ticket-card w-full max-w-md p-6 space-y-5 shadow-2xl bg-[#faf6ee]"
        >
          <div>
            <h2 class="text-lg text-[#2b1b12] font-bold">
              {{ editingProduct ? "Edit Produk" : "Tambah Produk Baru" }}
            </h2>
          </div>

          <div
            v-if="formError"
            class="p-3 bg-[#9b3a2e]/10 border border-[#9b3a2e]/20 rounded text-[#9b3a2e] text-xs font-medium"
          >
            <span class="font-bold uppercase">Perhatian:</span> {{ formError }}
          </div>

          <form
            class="space-y-4"
            @submit.prevent="handleSaveProduct"
            novalidate
          >
            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Kategori *</label
              >
              <select
                v-model.number="form.categoryId"
                required
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              >
                <option :value="0" disabled>-- Pilih Kategori --</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Nama Produk *</label
              >
              <input
                v-model.trim="form.name"
                type="text"
                required
                placeholder="Contoh: Kopi Susu"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >SKU (Opsional)</label
              >
              <input
                v-model.trim="form.sku"
                type="text"
                placeholder="Contoh: KOP-01"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >File Gambar Produk (Opsional)</label
              >
              <input
                type="file"
                accept="image/png, image/jpeg"
                @change="handleFileChange"
                class="field text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#2b1b12] file:text-[#faf6ee] hover:file:bg-[#b8763c] font-normal"
              />

              <div v-if="imagePreview" class="mt-2 flex items-center gap-3">
                <img
                  :src="imagePreview"
                  alt="Preview"
                  class="w-12 h-12 object-cover rounded border border-[#2b1b12]/20"
                />
                <span class="text-[10px] text-[#8A7A68] font-normal"
                  >Pratinjau Gambar</span
                >
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Harga Jual (Rp) *</label
                >
                <input
                  v-model.number="form.price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Harga Modal (Rp)</label
                >
                <input
                  v-model.number="form.costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Stok (Pcs) *</label
                >
                <input
                  v-model.number="form.stock"
                  type="number"
                  min="0"
                  required
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Status</label
                >
                <label class="flex items-center gap-2 mt-2.5 cursor-pointer">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="w-4 h-4 accent-[#2b1b12]"
                  />
                  <span class="text-xs text-[#2b1b12] font-semibold"
                    >Aktif dijual</span
                  >
                </label>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-3">
              <button
                type="submit"
                :disabled="isSaving"
                class="btn-stamp flex-1 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{
                  isSaving
                    ? "MENYIMPAN…"
                    : editingProduct
                      ? "SIMPAN PERUBAHAN"
                      : "TAMBAH PRODUK"
                }}
              </button>
              <button
                type="button"
                class="btn-cancel text-xs text-[#8A7A68] hover:text-[#faf6ee] px-4 py-2.5 rounded-lg border border-[#2b1b12]/20 transition font-semibold"
                @click="closeForm"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- MODAL CONFIRM DELETE (CUSTOM) -->
    <Teleport to="body">
      <div
        v-if="productToDelete && isOwner"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="cancelDelete"
      >
        <div class="ticket-card w-full max-w-sm p-6 space-y-4">
          <div class="text-center space-y-2">
            <div
              class="w-12 h-12 rounded-full bg-[#9b3a2e]/10 text-[#9b3a2e] flex items-center justify-center mx-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 class="text-lg text-[#2b1b12] font-bold">Hapus Produk?</h3>
            <p class="text-xs text-[#8A7A68]">
              Apakah Anda yakin ingin menghapus produk
              <span class="font-bold text-[#2b1b12]"
                >"{{ productToDelete.name }}"</span
              >? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              class="flex-1 py-2 rounded text-xs border border-[#2b1b12]/20 text-[#2b1b12] hover:bg-[#2b1b12]/5 transition font-semibold"
              :disabled="isDeleting"
              @click="cancelDelete"
            >
              Batal
            </button>
            <button
              type="button"
              class="flex-1 py-2 rounded text-xs bg-[#9b3a2e] text-[#faf6ee] font-bold hover:bg-[#7a2e24] transition disabled:opacity-50"
              :disabled="isDeleting"
              @click="executeDelete"
            >
              {{ isDeleting ? "MENGHAPUS..." : "HAPUS" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const { user } = useAuth();

useHead({
  title: 'Daftar Produk - Kasir'
})


// Cek apakah role user yang sedang login adalah PEMILIK
const isOwner = computed(() => {
  return user.value?.role?.toUpperCase() === "PEMILIK";
});

const {
  form,
  isFormOpen,
  isSaving,
  editingProduct,
  formError,
  imagePreview,
  handleFileChange,
  saveProduct,
  deleteProduct,
  openForm,
  closeForm,
} = useProductManager();

// State Filter & Pagination
const currentPage = ref(1);
const limit = ref(10);
const searchQuery = ref("");
const selectedCategory = ref("");
const selectedStatus = ref("");

// Debouncing Search (Mencegah Spam API saat Mengetik)
const debouncedSearch = ref("");
let searchTimeout = null;
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1;
  }, 400);
});

watch([selectedCategory, selectedStatus], () => {
  currentPage.value = 1;
});

// Fetch Data dari API
const {
  data: response,
  pending,
  error: fetchError,
  refresh: refreshProducts,
} = await useFetch("/api/products", {
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: debouncedSearch.value,
    category: selectedCategory.value,
    status: selectedStatus.value,
  })),
});

const products = computed(() => response.value?.data || []);
const pagination = computed(
  () =>
    response.value?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    },
);

// Fetch Category Options
const { data: categoryResponse } = await useFetch("/api/categories");
const categories = computed(() => categoryResponse.value?.data || []);

function formatCurrency(val) {
  if (val === null || val === undefined) return "Rp 0";
  return "Rp " + Number(val).toLocaleString("id-ID");
}

// --- Alert / Toast State (Custom, menggantikan SweetAlert2) ---
const alertMessage = ref("");
const alertType = ref("success"); // 'success' | 'error'
const showAlert = ref(false);

function triggerAlert(msg, type = "success") {
  alertMessage.value = msg;
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
}

// --- Simpan Produk (Tambah / Edit) dengan Toast Custom ---
async function handleSaveProduct() {
  const wasEditing = !!editingProduct.value;

  await saveProduct(refreshProducts);

  // Jika tidak ada formError setelah proses, anggap berhasil
  if (!formError.value) {
    triggerAlert(
      wasEditing
        ? "Produk berhasil diperbarui!"
        : "Produk berhasil ditambahkan!",
      "success",
    );
  }
}

// --- Konfirmasi Hapus Produk (Modal Custom) dengan Toast Custom ---
const productToDelete = ref(null);
const isDeleting = ref(false);

function confirmDelete(product) {
  // Keamanan tambahan di frontend: Jika bukan pemilik, hentikan fungsi
  if (!isOwner.value) {
    triggerAlert(
      "Akses ditolak. Hanya Pemilik yang dapat menghapus produk.",
      "error",
    );
    return;
  }

  if (isDeleting.value) return;
  productToDelete.value = product;
}

function cancelDelete() {
  if (isDeleting.value) return;
  productToDelete.value = null;
}

async function executeDelete() {
  if (!isOwner.value || !productToDelete.value || isDeleting.value) return;

  const product = productToDelete.value;
  isDeleting.value = true;

  try {
    await deleteProduct(product, refreshProducts);
    productToDelete.value = null;
    triggerAlert(`Produk "${product.name}" berhasil dihapus!`, "success");
  } catch (err) {
    triggerAlert(
      err?.data?.statusMessage || "Gagal menghapus produk.",
      "error",
    );
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.btn-cancel {
  background: transparent;
  border: 1.5px solid rgba(43, 27, 18, 0.2);
  color: #8a7a68;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: #9b3a2e;
  border-color: #9b3a2e;
  color: #faf6ee;
  transform: translateY(-1px);
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
  padding: 0.85rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.12s ease;
}

.btn-stamp:hover {
  background: #b8763c;
}

.display {
  font-family: "Space Grotesk", sans-serif;
}

.label-xs {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.11em;
}

/* SKELETON LOADING */
.skeleton {
  background: linear-gradient(90deg, #ede4d3 25%, #f4eee3 37%, #ede4d3 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
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
