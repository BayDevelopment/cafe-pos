<!-- app/pages/owner/karyawan.vue -->
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
            >DATA KARYAWAN</span
          >
        </div>
        <h1 class="text-xl md:text-2xl text-[#2b1b12] font-bold tracking-tight">
          Daftar Karyawan
        </h1>
        <p class="text-xs text-[#8A7A68] mt-0.5">
          Kelola akun, jabatan, dan status aktif karyawan toko.
        </p>
      </div>

      <button
        @click="openForm(null)"
        class="btn-stamp px-4 py-2.5 text-xs w-full md:w-auto flex items-center justify-center gap-2 font-semibold"
      >
        <span class="text-sm font-bold">＋</span> TAMBAH KARYAWAN
      </button>
    </div>

    <!-- FILTER & SEARCH -->
    <div class="ticket-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label
          class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
          >Cari Karyawan</label
        >
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nama, email, kode, atau jabatan..."
          class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:border-[#b8763c] outline-none font-normal"
        />
      </div>

      <div>
        <label
          class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
          >Filter Jabatan</label
        >
        <input
          v-model="selectedPosition"
          type="text"
          placeholder="Contoh: Barista"
          class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:border-[#b8763c] outline-none font-normal"
        />
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
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Nonaktif</option>
        </select>
      </div>
    </div>

    <!-- SKELETON LOADING -->
    <div v-if="pending" class="ticket-card overflow-hidden">
      <div class="p-6 text-center text-xs text-[#8A7A68]">
        Memuat data karyawan...
      </div>
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
      <p class="text-xs text-[#9b3a2e] font-medium">
        Gagal memuat data karyawan.
      </p>
      <button
        @click="refreshEmployees"
        class="btn-stamp inline-flex px-4 py-2 text-xs font-semibold"
      >
        COBA LAGI
      </button>
    </div>

    <!-- TABEL KARYAWAN -->
    <div v-else class="ticket-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[720px]">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Karyawan
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Kontak
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Jabatan
              </th>
              <th
                class="text-xs font-semibold text-left text-[#8A7A68] px-5 py-3 uppercase tracking-wider"
              >
                Bergabung
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
              v-for="employee in employees"
              :key="employee.id"
              class="border-b border-[#2b1b12]/5 last:border-0 hover:bg-[#f4eee3]/50 transition"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="employee.photo"
                    :src="employee.photo"
                    :alt="employee.name"
                    class="w-10 h-10 object-cover rounded-full border border-[#2b1b12]/10"
                  />
                  <div
                    v-else
                    class="w-10 h-10 bg-[#2b1b12]/10 rounded-full flex items-center justify-center text-[#8A7A68] text-xs font-bold"
                  >
                    {{ employee.name?.charAt(0).toUpperCase() || "?" }}
                  </div>
                  <div>
                    <p class="font-bold text-[#2b1b12] text-sm">
                      {{ employee.name || "-" }}
                    </p>
                    <p class="text-[10px] text-[#8A7A68]">
                      Kode: {{ employee.employeeCode }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4 text-xs text-[#2b1b12]">
                <p class="font-medium">{{ employee.email || "-" }}</p>
                <p class="text-[#8A7A68] mt-0.5">{{ employee.phone }}</p>
              </td>
              <td class="px-5 py-4 text-xs text-[#2b1b12] font-medium">
                {{ employee.position || "-" }}
              </td>
              <td class="px-5 py-4 text-xs text-[#2b1b12] font-medium">
                {{ formatDate(employee.joinDate) }}
              </td>
              <td class="px-5 py-4 text-center">
                <button
                  type="button"
                  :disabled="togglingId === employee.id"
                  title="Klik untuk ubah status"
                  @click="toggleStatus(employee)"
                  :class="[
                    'text-[10px] px-2 py-0.5 rounded font-semibold inline-block transition disabled:opacity-50',
                    employee.status === 'AKTIF'
                      ? 'bg-[#2f7a46]/10 text-[#2f7a46] hover:bg-[#2f7a46]/20'
                      : 'bg-[#8A7A68]/10 text-[#8A7A68] hover:bg-[#8A7A68]/20',
                  ]"
                >
                  {{ employee.status === "AKTIF" ? "AKTIF" : "NONAKTIF" }}
                </button>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openForm(employee)"
                    title="Edit Karyawan"
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

                  <button
                    @click="confirmDelete(employee)"
                    title="Hapus Karyawan"
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
            <tr v-if="employees.length === 0">
              <td colspan="6" class="p-10 text-center text-xs text-[#8A7A68]">
                Karyawan tidak ditemukan.
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
          Karyawan)
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

    <!-- MODAL FORM TAMBAH / EDIT -->
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
              {{ editingEmployee ? "Edit Karyawan" : "Tambah Karyawan Baru" }}
            </h2>
            <p v-if="editingEmployee" class="text-[10px] text-[#8A7A68] mt-0.5">
              Kode Karyawan: {{ editingEmployee.employeeCode }}
            </p>
          </div>

          <div
            v-if="formError"
            class="p-3 bg-[#9b3a2e]/10 border border-[#9b3a2e]/20 rounded text-[#9b3a2e] text-xs font-medium"
          >
            <span class="font-bold uppercase">Perhatian:</span> {{ formError }}
          </div>

          <form class="space-y-4" @submit.prevent="handleSaveEmployee" novalidate>
            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Nama Lengkap *</label
              >
              <input
                v-model.trim="form.name"
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Email *</label
              >
              <input
                v-model.trim="form.email"
                type="email"
                required
                placeholder="budi@kedaikopi.com"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >{{
                  editingEmployee
                    ? "Password Baru (Opsional)"
                    : "Password *"
                }}</label
              >
              <input
                v-model="form.password"
                type="password"
                :required="!editingEmployee"
                :placeholder="
                  editingEmployee
                    ? 'Kosongkan jika tidak ingin mengganti'
                    : 'Minimal 6 karakter'
                "
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Nomor Telepon *</label
              >
              <input
                v-model.trim="form.phone"
                type="text"
                required
                placeholder="Contoh: 0812xxxxxxx"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
              />
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Alamat (Opsional)</label
              >
              <textarea
                v-model.trim="form.address"
                rows="2"
                placeholder="Alamat domisili karyawan"
                class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal resize-none"
              ></textarea>
            </div>

            <div>
              <label
                class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                >Foto Karyawan (Opsional)</label
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
                  class="w-12 h-12 object-cover rounded-full border border-[#2b1b12]/20"
                />
                <span class="text-[10px] text-[#8A7A68] font-normal"
                  >Pratinjau Foto</span
                >
                <button
                  type="button"
                  class="text-[10px] text-[#9b3a2e] font-semibold hover:underline"
                  @click="clearPhoto"
                >
                  Hapus Foto
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Jabatan (Opsional)</label
                >
                <input
                  v-model.trim="form.position"
                  type="text"
                  placeholder="Contoh: Barista"
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Status</label
                >
                <select
                  v-model="form.status"
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="NONAKTIF">Nonaktif</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Tanggal Lahir (Opsional)</label
                >
                <input
                  v-model="form.birthDate"
                  type="date"
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
              </div>
              <div>
                <label
                  class="block text-xs font-semibold text-[#8A7A68] mb-1 uppercase tracking-wider"
                  >Tanggal Bergabung</label
                >
                <input
                  v-model="form.joinDate"
                  type="date"
                  class="field text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c] font-normal"
                />
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
                    : editingEmployee
                      ? "SIMPAN PERUBAHAN"
                      : "TAMBAH KARYAWAN"
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

    <!-- MODAL CONFIRM DELETE -->
    <Teleport to="body">
      <div
        v-if="employeeToDelete"
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
            <h3 class="text-lg text-[#2b1b12] font-bold">Hapus Karyawan?</h3>
            <p class="text-xs text-[#8A7A68]">
              Apakah Anda yakin ingin menghapus akun karyawan
              <span class="font-bold text-[#2b1b12]"
                >"{{ employeeToDelete.name }}"</span
              >? Akun login karyawan ini juga akan terhapus permanen dan
              tindakan ini tidak dapat dibatalkan.
            </p>
            <p class="text-[10px] text-[#8A7A68]">
              Tips: gunakan tombol status "NONAKTIF" pada tabel jika hanya
              ingin menonaktifkan sementara tanpa menghapus akun.
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
              {{ isDeleting ? "MENGHAPUS..." : "HAPUS PERMANEN" }}
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

const { user } = useAuth();

useHead({
  title: "Data Karyawan - Pemilik",
});

// Guard tambahan di level halaman: hanya PEMILIK yang boleh mengakses.
// (Selain proteksi di sidebar dan di server/api/karyawan/* via requireOwner)
watchEffect(() => {
  if (user.value && user.value.role?.toUpperCase() !== "PEMILIK") {
    navigateTo("/kasir/dashboard");
  }
});

// --- State Filter & Pagination ---
const currentPage = ref(1);
const limit = ref(10);
const searchQuery = ref("");
const selectedStatus = ref("");
const selectedPosition = ref("");

const debouncedSearch = ref("");
const debouncedPosition = ref("");
let searchTimeout = null;
watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1;
  }, 400);
});

let positionTimeout = null;
watch(selectedPosition, (newVal) => {
  clearTimeout(positionTimeout);
  positionTimeout = setTimeout(() => {
    debouncedPosition.value = newVal;
    currentPage.value = 1;
  }, 400);
});

watch(selectedStatus, () => {
  currentPage.value = 1;
});

// --- Fetch Data Karyawan ---
const {
  data: response,
  pending,
  error: fetchError,
  refresh: refreshEmployees,
} = await useFetch("/api/karyawan", {
  query: computed(() => ({
    page: currentPage.value,
    limit: limit.value,
    search: debouncedSearch.value,
    status: selectedStatus.value,
    position: debouncedPosition.value,
  })),
});

const employees = computed(() => response.value?.data || []);
const pagination = computed(
  () =>
    response.value?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
    },
);

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
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

// --- Form Tambah / Edit ---
const isFormOpen = ref(false);
const isSaving = ref(false);
const editingEmployee = ref(null);
const formError = ref("");
const imagePreview = ref(null);
const selectedFile = ref(null);
const photoRemoved = ref(false);

function defaultForm() {
  return {
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    position: "",
    status: "AKTIF",
    birthDate: "",
    joinDate: toDateInputValue(new Date()),
  };
}

const form = reactive(defaultForm());

function openForm(employee) {
  formError.value = "";
  selectedFile.value = null;
  photoRemoved.value = false;

  if (employee) {
    editingEmployee.value = employee;
    Object.assign(form, {
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      phone: employee.phone || "",
      address: employee.address || "",
      position: employee.position || "",
      status: employee.status || "AKTIF",
      birthDate: toDateInputValue(employee.birthDate),
      joinDate: toDateInputValue(employee.joinDate),
    });
    imagePreview.value = employee.photo || null;
  } else {
    editingEmployee.value = null;
    Object.assign(form, defaultForm());
    imagePreview.value = null;
  }

  isFormOpen.value = true;
}

function closeForm() {
  isFormOpen.value = false;
  editingEmployee.value = null;
  formError.value = "";
  selectedFile.value = null;
  photoRemoved.value = false;
}

function handleFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  selectedFile.value = file;
  photoRemoved.value = false;
  imagePreview.value = URL.createObjectURL(file);
}

function clearPhoto() {
  selectedFile.value = null;
  imagePreview.value = null;
  photoRemoved.value = true;
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = "";
}

async function handleSaveEmployee() {
  formError.value = "";

  if (!form.name || !form.email || !form.phone) {
    formError.value = "Nama, email, dan nomor telepon wajib diisi.";
    return;
  }
  if (!editingEmployee.value && (!form.password || form.password.length < 6)) {
    formError.value = "Password wajib diisi minimal 6 karakter untuk karyawan baru.";
    return;
  }

  isSaving.value = true;

  try {
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    if (form.password) formData.append("password", form.password);
    formData.append("phone", form.phone);
    formData.append("address", form.address || "");
    formData.append("position", form.position || "");
    formData.append("status", form.status);
    formData.append("birthDate", form.birthDate || "");
    formData.append("joinDate", form.joinDate || "");

    if (selectedFile.value) {
      formData.append("photo", selectedFile.value);
    } else if (photoRemoved.value) {
      formData.append("removePhoto", "true");
    }

    const wasEditing = !!editingEmployee.value;

    if (wasEditing) {
      await $fetch(`/api/karyawan/${editingEmployee.value.id}`, {
        method: "PUT",
        body: formData,
      });
    } else {
      await $fetch("/api/karyawan", {
        method: "POST",
        body: formData,
      });
    }

    await refreshEmployees();
    closeForm();
    triggerAlert(
      wasEditing
        ? "Data karyawan berhasil diperbarui!"
        : "Karyawan baru berhasil ditambahkan!",
      "success",
    );
  } catch (err) {
    formError.value =
      err?.data?.statusMessage || err?.data?.message || "Gagal menyimpan data karyawan.";
  } finally {
    isSaving.value = false;
  }
}

// --- Toggle Status Cepat (AKTIF <-> NONAKTIF) ---
const togglingId = ref(null);

async function toggleStatus(employee) {
  if (togglingId.value) return;

  const nextStatus = employee.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
  togglingId.value = employee.id;

  try {
    const formData = new FormData();
    formData.append("status", nextStatus);

    await $fetch(`/api/karyawan/${employee.id}`, {
      method: "PUT",
      body: formData,
    });

    await refreshEmployees();
    triggerAlert(
      `Status "${employee.name}" diubah menjadi ${nextStatus === "AKTIF" ? "Aktif" : "Nonaktif"}.`,
      "success",
    );
  } catch (err) {
    triggerAlert(
      err?.data?.statusMessage || "Gagal mengubah status karyawan.",
      "error",
    );
  } finally {
    togglingId.value = null;
  }
}

// --- Konfirmasi Hapus Permanen ---
const employeeToDelete = ref(null);
const isDeleting = ref(false);

function confirmDelete(employee) {
  if (isDeleting.value) return;
  employeeToDelete.value = employee;
}

function cancelDelete() {
  if (isDeleting.value) return;
  employeeToDelete.value = null;
}

async function executeDelete() {
  if (!employeeToDelete.value || isDeleting.value) return;

  const employee = employeeToDelete.value;
  isDeleting.value = true;

  try {
    await $fetch(`/api/karyawan/${employee.id}`, {
      method: "DELETE",
    });
    employeeToDelete.value = null;
    await refreshEmployees();
    triggerAlert(`Karyawan "${employee.name}" berhasil dihapus!`, "success");
  } catch (err) {
    triggerAlert(
      err?.data?.statusMessage || "Gagal menghapus karyawan.",
      "error",
    );
  } finally {
    isDeleting.value = false;
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

.btn-stamp {
  background: #2b1b12;
  color: #faf6ee;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
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

.btn-cancel:hover {
  background: #2b1b12;
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