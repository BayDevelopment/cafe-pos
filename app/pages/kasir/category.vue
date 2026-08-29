<!-- app/pages/kasir/kategori.vue -->
<template>
  <div
    class="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-poppins relative"
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

    <!-- HEADER HALAMAN -->
    <header
      class="ticket-card p-5 md:p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span
            class="label-xs px-2 py-0.5 rounded-md bg-[#2b1b12] text-[#faf6ee] font-semibold"
            >MANAJEMEN</span
          >
          <span class="label-xs text-[#8A7A68] font-semibold"
            >DATA KATEGORI</span
          >
        </div>
        <h1 class="text-xl md:text-2xl text-[#2b1b12] font-bold">
          Daftar Kategori
        </h1>
        <p class="text-xs text-[#8A7A68] mt-0.5">
          Kelola pengelompokan menu untuk memudahkan pencarian produk.
        </p>
      </div>

      <!-- TOMBOL TAMBAH KATEGORI: HANYA MUNCUL JIKA ROLE ADALAH PEMILIK -->
      <button
        v-if="isOwner"
        type="button"
        class="btn-stamp px-4 py-2.5 text-xs w-full md:w-auto rounded-lg font-semibold"
        @click="openCreateForm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 inline"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>TAMBAH KATEGORI</span>
      </button>
    </header>

    <!-- FILTER & SEARCH BAR -->
    <div
      class="ticket-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between"
    >
      <div class="w-full md:w-80 relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama kategori..."
          class="field text-xs pl-9 pr-3 py-2.5 bg-[#f4eee3] rounded-lg border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] transition"
        />
      </div>

      <div
        class="flex items-center gap-2 text-xs text-[#8A7A68] w-full md:w-auto justify-end font-medium"
      >
        <span>Tampilkan:</span>
        <select
          v-model="limit"
          class="bg-[#f4eee3] border border-[#2b1b12]/20 rounded-lg p-2 focus:outline-none text-xs font-semibold text-[#2b1b12]"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <span>data</span>
      </div>
    </div>

    <!-- LOADING STATE / SKELETON -->
    <div v-if="pending" class="ticket-card p-6 rounded-xl space-y-4">
      <div
        class="flex items-center justify-between pb-4 border-b border-[#2b1b12]/10"
      >
        <div class="skeleton h-5 w-32 rounded"></div>
        <div class="skeleton h-5 w-24 rounded"></div>
        <div class="skeleton h-5 w-20 rounded"></div>
      </div>
      <div
        v-for="n in 5"
        :key="n"
        class="flex items-center justify-between py-3"
      >
        <div class="space-y-2">
          <div class="skeleton h-4 w-40 rounded"></div>
        </div>
        <div class="skeleton h-6 w-20 rounded-md"></div>
        <div class="flex gap-2">
          <div class="skeleton h-8 w-8 rounded-lg"></div>
          <div class="skeleton h-8 w-8 rounded-lg"></div>
        </div>
      </div>
    </div>

    <!-- ERROR STATE -->
    <div
      v-else-if="fetchError"
      class="ticket-card p-12 rounded-xl text-center space-y-3"
    >
      <p class="text-xs text-[#9b3a2e] font-medium">
        Gagal memuat data kategori. Periksa koneksi atau coba lagi.
      </p>
      <button
        type="button"
        class="btn-stamp inline-flex px-4 py-2 text-xs rounded-lg font-semibold"
        @click="refreshCategories"
      >
        COBA LAGI
      </button>
    </div>

    <!-- TABEL KATEGORI -->
    <main v-else class="ticket-card rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[480px]">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]/80">
              <th
                scope="col"
                class="label-xs text-[#8A7A68] px-6 py-4 font-semibold"
              >
                Nama Kategori
              </th>
              <th
                scope="col"
                class="label-xs text-[#8A7A68] px-6 py-4 font-semibold"
              >
                Jumlah Produk
              </th>
              <th
                v-if="isOwner"
                scope="col"
                class="label-xs text-center text-[#8A7A68] px-6 py-4 font-semibold"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2b1b12]/5">
            <tr
              v-for="category in categories"
              :key="category.id"
              class="hover:bg-[#f4eee3]/60 transition-colors group"
            >
              <td class="px-6 py-4 font-bold text-[#2b1b12] text-base">
                {{ category.name }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="label-xs px-2.5 py-1 rounded-md bg-[#b8763c]/10 text-[#b8763c] font-semibold"
                >
                  {{ getProductCount(category) }} produk
                </span>
              </td>
              <td v-if="isOwner" class="px-6 py-4 text-center">
                <div class="inline-flex items-center justify-center gap-2">
                  <!-- ICON EDIT -->
                  <button
                    type="button"
                    title="Edit Kategori"
                    class="p-2 rounded-lg bg-[#b8763c]/10 text-[#b8763c] hover:bg-[#b8763c] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                    @click="openEditForm(category)"
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

                  <!-- ICON HAPUS -->
                  <button
                    type="button"
                    title="Hapus Kategori"
                    class="p-2 rounded-lg bg-[#9b3a2e]/10 text-[#9b3a2e] hover:bg-[#9b3a2e] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                    @click="confirmDelete(category)"
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
          </tbody>
        </table>
      </div>

      <div
        v-if="categories.length === 0"
        class="p-12 text-center text-xs text-[#8A7A68] font-medium"
      >
        <template v-if="searchQuery">
          Tidak ditemukan kategori dengan kata kunci "{{ searchQuery }}".
        </template>
        <template v-else> Belum ada kategori. </template>
      </div>

      <!-- PAGINATION CONTROLS -->
      <div
        class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#2b1b12]/10 bg-[#f4eee3]/30"
      >
        <span class="text-xs text-[#8A7A68]">
          Halaman
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.currentPage || pagination.page || 1
          }}</strong>
          dari
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.totalPages || 1
          }}</strong>
          (Total
          <strong class="text-[#2b1b12] font-semibold">{{
            pagination.totalItems || pagination.total || 0
          }}</strong>
          Kategori)
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
    </main>

    <!-- MODAL FORM TAMBAH / EDIT (Hanya untuk PEMILIK) -->
    <Teleport to="body">
      <div
        v-if="isFormOpen && isOwner"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeForm"
      >
        <div
          class="ticket-card rounded-xl w-full max-w-md p-6 space-y-5 animate-scale-in"
        >
          <div>
            <h2 class="text-lg text-[#2b1b12] font-bold">
              {{ editingCategory ? "Edit Kategori" : "Tambah Kategori Baru" }}
            </h2>
            <p class="text-xs text-[#8A7A68] mt-0.5">
              Isi nama kategori dengan jelas dan singkat.
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="submitForm">
            <div>
              <label
                for="category-name"
                class="label-xs block text-[#8A7A68] mb-1 font-semibold"
                >Nama Kategori *</label
              >
              <input
                id="category-name"
                v-model.trim="form.name"
                type="text"
                required
                placeholder="Contoh: Minuman Kopi"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded-lg border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]"
              />
            </div>

            <p v-if="formError" class="text-xs text-[#9b3a2e] font-medium">
              {{ formError }}
            </p>

            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                :disabled="isSaving"
                class="btn-stamp flex-1 py-2.5 text-xs rounded-lg font-semibold"
              >
                <span
                  v-if="isSaving"
                  class="dot-spin"
                  aria-hidden="true"
                ></span>
                {{
                  isSaving
                    ? "MENYIMPAN…"
                    : editingCategory
                      ? "SIMPAN PERUBAHAN"
                      : "TAMBAH KATEGORI"
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

    <!-- MODAL CONFIRM DELETE (Hanya untuk PEMILIK) -->
    <Teleport to="body">
      <div
        v-if="categoryToDelete && isOwner"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="cancelDelete"
      >
        <div class="ticket-card rounded-xl w-full max-w-sm p-6 space-y-4">
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
            <h3 class="text-lg text-[#2b1b12] font-bold">Hapus Kategori?</h3>
            <p class="text-xs text-[#8A7A68]">
              <span class="font-bold text-[#2b1b12]"
                >"{{ categoryToDelete.name }}"</span
              >
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <p
              v-if="getProductCount(categoryToDelete) > 0"
              class="text-xs text-[#9b3a2e] font-semibold bg-[#9b3a2e]/10 border border-[#9b3a2e]/20 rounded p-2 mt-2"
            >
              ⚠️ Kategori ini masih digunakan oleh
              {{ getProductCount(categoryToDelete) }} produk!
            </p>
          </div>

          <div class="flex items-center gap-2 pt-2">
            <button
              type="button"
              class="flex-1 py-2 rounded-lg text-xs border border-[#2b1b12]/20 text-[#2b1b12] hover:bg-[#2b1b12]/5 transition font-semibold"
              :disabled="isDeleting"
              @click="cancelDelete"
            >
              Batal
            </button>
            <button
              type="button"
              class="flex-1 py-2 rounded-lg text-xs bg-[#9b3a2e] text-[#faf6ee] font-bold hover:bg-[#7a2e24] transition disabled:opacity-50"
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
definePageMeta({
  middleware: ["auth"],
});

useHead({
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
    },
  ],
});

useHead({
  title: 'Daftar Category - Kasir'
})


const { user } = useAuth();

// Cek apakah role user yang sedang login adalah PEMILIK
const isOwner = computed(() => {
  return user.value?.role?.toUpperCase() === "PEMILIK";
});

// --- Pagination & Search State ---
const currentPage = ref(1);
const limit = ref(10);
const searchQuery = ref("");

// Debouncing Search (Mencegah Spam API saat Mengetik)
const debouncedSearch = ref("");
let searchTimeout = null;

watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1; // Reset ke halaman 1 saat mulai mencari
  }, 400);
});

watch(limit, () => {
  currentPage.value = 1; // Reset ke halaman 1 jika limit diubah
});

// Fetch Data dengan Computed Query agar Reactive
const {
  data: response,
  pending,
  error: fetchError,
  refresh: refreshCategories,
} = await useFetch("/api/categories", {
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: debouncedSearch.value,
  })),
});

const categories = computed(() => response.value?.data || []);
const pagination = computed(
  () =>
    response.value?.pagination || {
      total: 0,
      totalItems: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
);

function getProductCount(category) {
  return category?._count?.products ?? category?.productCount ?? 0;
}

// --- Alert / Toast State ---
const alertMessage = ref("");
const alertType = ref("success");
const showAlert = ref(false);

function triggerAlert(msg, type = "success") {
  alertMessage.value = msg;
  alertType.value = type;
  showAlert.value = true;
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
}

// --- Form State ---
const isFormOpen = ref(false);
const editingCategory = ref(null);
const isSaving = ref(false);
const formError = ref("");

const form = reactive({
  name: "",
});

function resetForm() {
  form.name = "";
  formError.value = "";
}

function openCreateForm() {
  if (!isOwner.value) {
    triggerAlert(
      "Akses ditolak. Hanya Pemilik yang dapat menambah kategori.",
      "error",
    );
    return;
  }
  editingCategory.value = null;
  resetForm();
  isFormOpen.value = true;
}

function openEditForm(category) {
  if (!isOwner.value) {
    triggerAlert(
      "Akses ditolak. Hanya Pemilik yang dapat mengubah kategori.",
      "error",
    );
    return;
  }
  editingCategory.value = category;
  form.name = category.name;
  formError.value = "";
  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
  editingCategory.value = null;
  resetForm();
}

async function submitForm() {
  if (!isOwner.value) return;

  const trimmedName = form.name ? form.name.trim() : "";

  if (!trimmedName) {
    formError.value = "Nama kategori wajib diisi.";
    return;
  }

  const validNamePattern = /^[a-zA-Z0-9\s&\-/()]+$/;
  if (!validNamePattern.test(trimmedName)) {
    formError.value =
      "Nama kategori hanya boleh berisi huruf, angka, spasi, dan simbol (&, -, /, ()).";
    return;
  }

  const wasEditing = !!editingCategory.value;
  isSaving.value = true;
  formError.value = "";

  try {
    const endpoint = editingCategory.value
      ? `/api/categories/${editingCategory.value.id}`
      : "/api/categories";

    const method = editingCategory.value ? "PUT" : "POST";

    await $fetch(endpoint, {
      method,
      body: { name: trimmedName },
    });

    await refreshCategories();
    closeForm();

    triggerAlert(
      wasEditing
        ? "Kategori berhasil diperbarui!"
        : "Kategori berhasil dibuat!",
      "success",
    );
  } catch (error) {
    formError.value =
      "Gagal menyimpan kategori: " +
      (error.data?.statusMessage || error.data?.message || error.message);
  } finally {
    isSaving.value = false;
  }
}

// --- Konfirmasi Hapus Kategori ---
const categoryToDelete = ref(null);
const isDeleting = ref(false);

function confirmDelete(category) {
  if (!isOwner.value) {
    triggerAlert(
      "Akses ditolak. Hanya Pemilik yang dapat menghapus kategori.",
      "error",
    );
    return;
  }

  if (isDeleting.value) return;
  categoryToDelete.value = category;
}

function cancelDelete() {
  if (isDeleting.value) return;
  categoryToDelete.value = null;
}

async function executeDelete() {
  if (!isOwner.value || !categoryToDelete.value || isDeleting.value) return;

  const category = categoryToDelete.value;
  isDeleting.value = true;

  try {
    await $fetch(`/api/categories/${category.id}`, { method: "DELETE" });
    await refreshCategories();
    categoryToDelete.value = null;
    triggerAlert(`Kategori "${category.name}" berhasil dihapus!`, "success");
  } catch (error) {
    triggerAlert(
      error.data?.statusMessage ||
        error.data?.message ||
        error.message ||
        "Gagal menghapus kategori.",
      "error",
    );
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped>
.font-poppins {
  font-family: "Poppins", sans-serif;
}

.label-xs {
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ticket-card {
  background: #faf6ee;
  border: 1.5px solid rgba(43, 27, 18, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.btn-stamp {
  background: #2b1b12;
  color: #faf6ee;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition:
    transform 0.12s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: #b8763c;
  border-color: #b8763c;
  transform: translateY(-1px);
}

.btn-stamp:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

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

.skeleton {
  background: linear-gradient(90deg, #f4eee3 25%, #ebdcc7 50%, #f4eee3 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
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
