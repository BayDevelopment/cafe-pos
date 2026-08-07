<!-- app/pages/kasir/kategori.vue -->
<template>
  <div class="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-5 md:p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded-md bg-[#2b1b12] text-[#faf6ee]">MANAJEMEN</span>
          <span class="mono label-xs text-[#8A7A68]">DATA KATEGORI</span>
        </div>
        <h1 class="display text-xl md:text-2xl text-[#2b1b12] font-bold">Daftar Kategori</h1>
        <p class="mono text-xs text-[#8A7A68] mt-0.5">Kelola pengelompokan menu untuk memudahkan pencarian produk.</p>
      </div>

      <button 
        type="button"
        class="btn-stamp mono px-4 py-2.5 text-xs w-full md:w-auto rounded-lg"
        @click="openCreateForm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span>TAMBAH KATEGORI</span>
      </button>
    </header>

    <!-- FILTER & SEARCH BAR -->
    <div class="ticket-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="w-full md:w-80 relative">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8A7A68]">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama kategori..."
          class="field mono text-xs pl-9 pr-3 py-2.5 bg-[#f4eee3] rounded-lg border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] transition"
        />
      </div>

      <div class="flex items-center gap-2 text-xs mono text-[#8A7A68] w-full md:w-auto justify-end">
        <span>Tampilkan:</span>
        <select 
          v-model="limit" 
          class="bg-[#f4eee3] border border-[#2b1b12]/20 rounded-lg p-2 focus:outline-none text-xs font-semibold"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <span>data</span>
      </div>
    </div>

    <!-- LOADING STATE -->
    <div v-if="pending" class="ticket-card p-12 rounded-xl text-center mono text-xs text-[#8A7A68]">
      MEMUAT DATA KATEGORI...
    </div>

    <!-- ERROR STATE -->
    <div v-else-if="fetchError" class="ticket-card p-12 rounded-xl text-center space-y-3">
      <p class="mono text-xs text-[#9b3a2e]">Gagal memuat data kategori. Periksa koneksi atau coba lagi.</p>
      <button 
        type="button" 
        class="btn-stamp mono inline-flex px-4 py-2 text-xs rounded-lg"
        @click="refreshCategories"
      >
        COBA LAGI
      </button>
    </div>

    <!-- TABEL KATEGORI (CARD STYLE WITH ROUNDED CORNERS) -->
    <main v-else class="ticket-card rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left min-w-[480px]">
          <thead>
            <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]/80">
              <th scope="col" class="mono label-xs text-[#8A7A68] px-6 py-4">Nama Kategori</th>
              <th scope="col" class="mono label-xs text-[#8A7A68] px-6 py-4">Jumlah Produk</th>
              <th scope="col" class="mono label-xs text-center text-[#8A7A68] px-6 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#2b1b12]/5">
            <tr 
              v-for="category in categories" 
              :key="category.id"
              class="hover:bg-[#f4eee3]/60 transition-colors group"
            >
              <td class="px-6 py-4 font-bold text-[#2b1b12] display text-base">
                {{ category.name }}
              </td>
              <td class="px-6 py-4">
                <span class="mono label-xs px-2.5 py-1 rounded-md bg-[#b8763c]/10 text-[#b8763c] font-semibold">
                  {{ getProductCount(category) }} produk
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="inline-flex items-center justify-center gap-2">
                  <!-- ICON EDIT -->
                  <button 
                    type="button"
                    title="Edit Kategori"
                    class="p-2 rounded-lg bg-[#b8763c]/10 text-[#b8763c] hover:bg-[#b8763c] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                    @click="openEditForm(category)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>

                  <!-- ICON HAPUS -->
                  <button 
                    type="button"
                    title="Hapus Kategori"
                    class="p-2 rounded-lg bg-[#9b3a2e]/10 text-[#9b3a2e] hover:bg-[#9b3a2e] hover:text-[#faf6ee] active:scale-95 transition-all duration-150"
                    @click="confirmDelete(category)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

      <div v-if="categories.length === 0" class="p-12 text-center mono text-xs text-[#8A7A68]">
        <template v-if="searchQuery">
          Tidak ditemukan kategori dengan kata kunci "{{ searchQuery }}".
        </template>
        <template v-else>
          Belum ada kategori. Klik "Tambah Kategori" untuk membuat data pertama.
        </template>
      </div>

      <!-- PAGINATION CONTROL -->
      <footer v-if="pagination.totalPages > 1" class="p-4 bg-[#f4eee3]/50 border-t border-[#2b1b12]/10 flex flex-col sm:flex-row items-center justify-between gap-3 mono text-xs">
        <span class="text-[#8A7A68]">
          Menampilkan {{ (currentPage - 1) * limit + 1 }} - {{ Math.min(currentPage * limit, pagination.total) }} dari {{ pagination.total }} data
        </span>

        <div class="flex items-center gap-2">
          <button 
            type="button"
            :disabled="currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-[#2b1b12]/20 bg-[#faf6ee] text-[#2b1b12] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8763c] hover:text-[#faf6ee] transition"
            @click="currentPage--"
          >
            ← SEBELUMNYA
          </button>

          <span class="px-2 font-bold text-[#2b1b12]">
            {{ currentPage }} / {{ pagination.totalPages }}
          </span>

          <button 
            type="button"
            :disabled="currentPage >= pagination.totalPages"
            class="px-3 py-1.5 rounded-lg border border-[#2b1b12]/20 bg-[#faf6ee] text-[#2b1b12] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#b8763c] hover:text-[#faf6ee] transition"
            @click="currentPage++"
          >
            SELANJUTNYA →
          </button>
        </div>
      </footer>
    </main>

    <!-- MODAL FORM TAMBAH / EDIT -->
    <div 
      v-if="isFormOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      @click.self="closeForm"
    >
      <div class="ticket-card rounded-xl w-full max-w-md p-6 space-y-5">
        <div>
          <h2 class="display text-lg text-[#2b1b12] font-bold">
            {{ editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru' }}
          </h2>
          <p class="mono text-xs text-[#8A7A68] mt-0.5">Isi nama kategori dengan jelas dan singkat.</p>
        </div>

        <form class="space-y-4" @submit.prevent="submitForm">
          <div>
            <label for="category-name" class="mono label-xs block text-[#8A7A68] mb-1">Nama Kategori *</label>
            <input 
              id="category-name"
              v-model.trim="form.name" 
              type="text" 
              required 
              placeholder="Contoh: Minuman Kopi"
              class="field mono text-sm p-2.5 bg-[#f4eee3] rounded-lg border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]" 
            />
          </div>

          <p v-if="formError" class="mono text-xs text-[#9b3a2e]">{{ formError }}</p>

          <div class="flex items-center gap-3 pt-2">
            <button 
              type="submit" 
              :disabled="isSaving" 
              class="btn-stamp mono flex-1 py-2.5 text-xs rounded-lg"
            >
              <span v-if="isSaving" class="dot-spin" aria-hidden="true"></span>
              {{ isSaving ? 'MENYIMPAN…' : (editingCategory ? 'SIMPAN PERUBAHAN' : 'TAMBAH KATEGORI') }}
            </button>
            <button 
              type="button" 
              class="mono text-xs text-[#8A7A68] hover:text-[#2b1b12] px-4 py-2.5 transition"
              @click="closeForm"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
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

async function getSwal() {
  if (import.meta.client) {
    await import('sweetalert2/dist/sweetalert2.min.css')
    const Swal = (await import('sweetalert2')).default
    return Swal
  }
  return null
}

// --- Pagination & Search State ---
const searchQuery = ref('')
const currentPage = ref(1)
const limit = ref(10)

watch([searchQuery, limit], () => {
  currentPage.value = 1
})

const { data: response, pending, error: fetchError, refresh: refreshCategories } = await useFetch('/api/categories', {
  query: {
    search: searchQuery,
    page: currentPage,
    limit: limit
  },
  watch: [searchQuery, currentPage, limit]
})

const categories = computed(() => response.value?.data || [])
const pagination = computed(() => response.value?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 })

function getProductCount(category) {
  return category?._count?.products ?? category?.productCount ?? 0
}

// --- Form State ---
const isFormOpen = ref(false)
const editingCategory = ref(null)
const isSaving = ref(false)
const formError = ref('')

const form = reactive({
  name: ''
})

function resetForm() {
  form.name = ''
  formError.value = ''
}

function openCreateForm() {
  editingCategory.value = null
  resetForm()
  isFormOpen.value = true
}

function openEditForm(category) {
  editingCategory.value = category
  form.name = category.name
  formError.value = ''
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingCategory.value = null
  resetForm()
}

async function submitForm() {
  const trimmedName = form.name ? form.name.trim() : ''

  if (!trimmedName) {
    formError.value = 'Nama kategori wajib diisi.'
    return
  }

  const validNamePattern = /^[a-zA-Z0-9\s&\-/()]+$/
  if (!validNamePattern.test(trimmedName)) {
    formError.value = 'Nama kategori hanya boleh berisi huruf, angka, spasi, dan simbol (&, -, /, ()).'
    return
  }

  isSaving.value = true
  formError.value = ''

  try {
    const endpoint = editingCategory.value 
      ? `/api/categories/${editingCategory.value.id}` 
      : '/api/categories'
    
    const method = editingCategory.value ? 'PUT' : 'POST'

    await $fetch(endpoint, {
      method,
      body: { name: trimmedName }
    })

    await refreshCategories()
    closeForm()

    const Swal = await getSwal()
    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: editingCategory.value ? 'Kategori berhasil diperbarui' : 'Kategori berhasil dibuat',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })
    }
  } catch (error) {
    formError.value = 'Gagal menyimpan kategori: ' + (error.data?.statusMessage || error.data?.message || error.message)
  } finally {
    isSaving.value = false
  }
}

// --- Delete Handling ---
async function confirmDelete(category) {
  const count = getProductCount(category)
  let warningText = `"${category.name}" akan dihapus permanen.`
  
  if (count > 0) {
    warningText += `\n⚠️ Kategori ini masih digunakan oleh ${count} produk!`
  }

  const Swal = await getSwal()
  if (Swal) {
    const result = await Swal.fire({
      title: 'Hapus Kategori?',
      text: warningText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#9b3a2e',
      cancelButtonColor: '#8A7A68',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        await $fetch(`/api/categories/${category.id}`, { method: 'DELETE' })
        await refreshCategories()

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Kategori berhasil dihapus',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: error.data?.statusMessage || error.data?.message || error.message,
          confirmButtonText: 'Tutup'
        })
      }
    }
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
  border: 1.5px solid rgba(43, 27, 18, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.btn-stamp {
  background: #2b1b12;
  color: #faf6ee;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  padding: 0.75rem 1rem;
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
  transform: translateY(-1px);
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