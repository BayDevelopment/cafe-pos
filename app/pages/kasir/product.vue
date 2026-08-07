<!-- app/pages/kasir/produk.vue -->
<template>
    <div class="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8 font-sans">

        <!-- HEADER HALAMAN -->
        <div class="ticket-card p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">MANAJEMEN</span>
                    <span class="mono label-xs text-[#8A7A68]">DATA PRODUK</span>
                </div>
                <h1 class="display text-xl md:text-2xl text-[#2b1b12] font-bold">Daftar Produk</h1>
                <p class="mono text-xs text-[#8A7A68] mt-0.5">Kelola menu, harga, stok, dan kategori toko.</p>
            </div>

            <button @click="openForm(null, categories)"
                class="btn-stamp mono px-4 py-2.5 text-xs w-full md:w-auto flex items-center justify-center gap-2">
                <span class="text-sm font-bold">＋</span> TAMBAH PRODUK
            </button>
        </div>

        <!-- FILTER & SEARCH SECTION -->
        <div class="ticket-card p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label class="mono label-xs block text-[#8A7A68] mb-1">Cari Produk</label>
                <input v-model="searchQuery" type="text" placeholder="Nama produk atau SKU..."
                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:border-[#b8763c] outline-none" />
            </div>

            <div>
                <label class="mono label-xs block text-[#8A7A68] mb-1">Filter Kategori</label>
                <select v-model="selectedCategory"
                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none">
                    <option value="">Semua Kategori</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
            </div>

            <div>
                <label class="mono label-xs block text-[#8A7A68] mb-1">Filter Status</label>
                <select v-model="selectedStatus"
                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none">
                    <option value="">Semua Status</option>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                </select>
            </div>
        </div>

        <!-- LOADING STATE: SKELETON -->
        <div v-if="pending" class="ticket-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Info Produk</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Kategori</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Harga</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Stok</th>
                            <th class="mono label-xs text-center text-[#8A7A68] px-5 py-3">Status</th>
                            <th class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in 5" :key="n" class="border-b border-[#2b1b12]/5 last:border-0">
                            <td class="px-5 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="skeleton w-10 h-10 rounded"></div>
                                    <div class="space-y-2">
                                        <div class="skeleton h-3 w-28 rounded"></div>
                                        <div class="skeleton h-2 w-16 rounded"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-5 py-4"><div class="skeleton h-3 w-20 rounded"></div></td>
                            <td class="px-5 py-4"><div class="skeleton h-3 w-24 rounded"></div></td>
                            <td class="px-5 py-4"><div class="skeleton h-5 w-14 rounded-full"></div></td>
                            <td class="px-5 py-4 text-center"><div class="skeleton h-5 w-16 rounded-full mx-auto"></div></td>
                            <td class="px-5 py-4">
                                <div class="flex items-center justify-end gap-2">
                                    <div class="skeleton w-8 h-8 rounded-md"></div>
                                    <div class="skeleton w-8 h-8 rounded-md"></div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ERROR STATE -->
        <div v-else-if="fetchError" class="ticket-card p-10 text-center space-y-3">
            <p class="mono text-xs text-[#9b3a2e]">Gagal memuat data produk.</p>
            <button @click="refreshProducts" class="btn-stamp mono inline-flex px-4 py-2 text-xs">COBA LAGI</button>
        </div>

        <!-- TABEL PRODUK -->
        <div v-else class="ticket-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[640px]">
                    <thead>
                        <tr class="border-b border-[#2b1b12]/10 bg-[#f4eee3]">
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Info Produk</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Kategori</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Harga</th>
                            <th class="mono label-xs text-left text-[#8A7A68] px-5 py-3">Stok</th>
                            <th class="mono label-xs text-center text-[#8A7A68] px-5 py-3">Status</th>
                            <th class="mono label-xs text-right text-[#8A7A68] px-5 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in filteredProducts" :key="product.id"
                            class="border-b border-[#2b1b12]/5 last:border-0 hover:bg-[#f4eee3]/50 transition">
                            <td class="px-5 py-4">
                                <div class="flex items-center gap-3">
                                    <img v-if="product.image" :src="product.image" :alt="product.name"
                                        class="w-10 h-10 object-cover rounded border border-[#2b1b12]/10" />
                                    <div v-else
                                        class="w-10 h-10 bg-[#2b1b12]/10 rounded flex items-center justify-center text-[#8A7A68] text-xs font-bold">
                                        IMG
                                    </div>
                                    <div>
                                        <p class="display font-bold text-[#2b1b12]">{{ product.name }}</p>
                                        <p v-if="product.sku" class="mono text-[10px] text-[#8A7A68]">SKU: {{
                                            product.sku }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-5 py-4 mono text-xs text-[#2b1b12]">{{ product.category?.name || '-' }}</td>
                            <td class="px-5 py-4 mono text-[#2b1b12]">
                                {{ formatCurrency(product.price) }}
                                <div v-if="product.costPrice" class="text-[10px] text-[#8A7A68]">Modal: {{
                                    formatCurrency(product.costPrice) }}</div>
                            </td>
                            <td class="px-5 py-4">
                                <span
                                    :class="['mono label-xs px-2.5 py-1 rounded font-semibold', product.stock > 5 ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#9b3a2e]/10 text-[#9b3a2e]']">
                                    {{ product.stock }} Pcs
                                </span>
                            </td>
                            <td class="px-5 py-4 text-center">
                                <span
                                    :class="['mono text-[10px] px-2 py-0.5 rounded font-semibold', product.isActive ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#8A7A68]/10 text-[#8A7A68]']">
                                    {{ product.isActive ? 'AKTIF' : 'NONAKTIF' }}
                                </span>
                            </td>
                            <td class="px-5 py-4">
                                <div class="flex items-center justify-end gap-2">
                                    <button @click="openForm(product, categories)" title="Edit Produk"
                                        class="p-2 rounded-md bg-[#2b1b12]/5 hover:bg-[#b8763c]/20 text-[#2b1b12] hover:text-[#b8763c] transition border border-[#2b1b12]/10 flex items-center justify-center shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button @click="confirmDelete(product)" title="Hapus Produk"
                                        class="p-2 rounded-md bg-[#9b3a2e]/10 hover:bg-[#9b3a2e]/20 text-[#9b3a2e] transition border border-[#9b3a2e]/20 flex items-center justify-center shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="filteredProducts.length === 0">
                            <td colspan="6" class="p-10 text-center mono text-xs text-[#8A7A68]">Produk tidak ditemukan.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- PAGINATION CONTROLS -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#2b1b12]/10 bg-[#f4eee3]/30">
                <span class="mono text-xs text-[#8A7A68]">
                    Halaman <strong class="text-[#2b1b12]">{{ pagination.currentPage }}</strong> dari <strong class="text-[#2b1b12]">{{ pagination.totalPages || 1 }}</strong> (Total <strong class="text-[#2b1b12]">{{ pagination.totalItems }}</strong> Produk)
                </span>
                <div class="flex items-center gap-2">
                    <button @click="currentPage--" :disabled="currentPage === 1"
                        class="px-3 py-1.5 mono text-xs bg-[#f4eee3] hover:bg-[#e8decb] border border-[#2b1b12]/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-[#2b1b12] transition font-semibold">
                        ← Sebelumnya
                    </button>
                    <button @click="currentPage++" :disabled="currentPage >= (pagination.totalPages || 1)"
                        class="px-3 py-1.5 mono text-xs bg-[#f4eee3] hover:bg-[#e8decb] border border-[#2b1b12]/20 rounded disabled:opacity-40 disabled:cursor-not-allowed text-[#2b1b12] transition font-semibold">
                        Berikutnya →
                    </button>
                </div>
            </div>
        </div>

        <!-- MODAL FORM TAMBAH / EDIT -->
        <Teleport to="body">
            <div v-if="isFormOpen"
                class="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex items-start justify-center py-10"
                @click.self="closeForm">
                <div class="ticket-card w-full max-w-md p-6 space-y-5 shadow-2xl bg-[#faf6ee]">
                    <div>
                        <h2 class="display text-lg text-[#2b1b12] font-bold">
                            {{ editingProduct ? 'Edit Produk' : 'Tambah Produk Baru' }}
                        </h2>
                    </div>

                    <!-- PESAN ERROR INLINE (DANGER TEXT DI DALAM MODAL) -->
                    <div v-if="formError" class="p-3 bg-[#9b3a2e]/10 border border-[#9b3a2e]/20 rounded text-[#9b3a2e] text-xs font-mono">
                        <span class="font-bold uppercase">Perhatian:</span> {{ formError }}
                    </div>

                    <form class="space-y-4" @submit.prevent="saveProduct(refreshProducts)" novalidate>
                        <div>
                            <label class="mono label-xs block text-[#8A7A68] mb-1">Kategori *</label>
                            <select v-model.number="form.categoryId" required
                                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]">
                                <option :value="0" disabled>-- Pilih Kategori --</option>
                                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                            </select>
                        </div>

                        <div>
                            <label class="mono label-xs block text-[#8A7A68] mb-1">Nama Produk *</label>
                            <input v-model.trim="form.name" type="text" required placeholder="Contoh: Kopi Susu"
                                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]" />
                        </div>

                        <div>
                            <label class="mono label-xs block text-[#8A7A68] mb-1">SKU (Opsional)</label>
                            <input v-model.trim="form.sku" type="text" placeholder="Contoh: KOP-01"
                                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]" />
                        </div>

                        <!-- INPUT FILE GAMBAR -->
                        <div>
                            <label class="mono label-xs block text-[#8A7A68] mb-1">File Gambar Produk (Opsional)</label>
                            <input type="file" accept="image/*" @change="handleFileChange"
                                class="field mono text-xs p-2 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#2b1b12] file:text-[#faf6ee] hover:file:bg-[#b8763c]" />

                            <!-- PREVIEW GAMBAR -->
                            <div v-if="imagePreview" class="mt-2 flex items-center gap-3">
                                <img :src="imagePreview" alt="Preview"
                                    class="w-12 h-12 object-cover rounded border border-[#2b1b12]/20" />
                                <span class="mono text-[10px] text-[#8A7A68]">Pratinjau Gambar Baru</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="mono label-xs block text-[#8A7A68] mb-1">Harga Jual (Rp) *</label>
                                <input v-model.number="form.price" type="number" step="0.01" min="0" required
                                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]" />
                            </div>
                            <div>
                                <label class="mono label-xs block text-[#8A7A68] mb-1">Harga Modal (Rp)</label>
                                <input v-model.number="form.costPrice" type="number" step="0.01" min="0"
                                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]" />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="mono label-xs block text-[#8A7A68] mb-1">Stok (Pcs) *</label>
                                <input v-model.number="form.stock" type="number" min="0" required
                                    class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full outline-none focus:border-[#b8763c]" />
                            </div>
                            <div>
                                <label class="mono label-xs block text-[#8A7A68] mb-1">Status</label>
                                <label class="flex items-center gap-2 mt-2.5 cursor-pointer">
                                    <input v-model="form.isActive" type="checkbox" class="w-4 h-4 accent-[#2b1b12]" />
                                    <span class="mono text-xs text-[#2b1b12] font-semibold">Aktif dijual</span>
                                </label>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 pt-3">
                            <button type="submit" :disabled="isSaving"
                                class="btn-stamp mono flex-1 py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                                {{ isSaving ? 'MENYIMPAN…' : (editingProduct ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK') }}
                            </button>
                            <button type="button" @click="closeForm"
                                class="mono text-xs text-[#2b1b12] bg-[#f4eee3] hover:bg-[#e8decb] border border-[#2b1b12]/20 px-5 py-2.5 rounded transition font-semibold">
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import Swal from 'sweetalert2'

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
    closeForm
} = useProductManager()

// Pagination State
const currentPage = ref(1)
const limit = ref(10)

// Fetch data produk dengan parameter pagination reaktif
const { data: response, pending, error: fetchError, refresh: refreshProducts } = await useFetch('/api/products', {
    query: computed(() => ({
        page: currentPage.value,
        limit: limit.value
    }))
})

const products = computed(() => response.value?.data || [])
const pagination = computed(() => response.value?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 })

// Fetch kategori
const { data: categoryResponse } = await useFetch('/api/categories')
const categories = computed(() => categoryResponse.value?.data || [])

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

const filteredProducts = computed(() => {
    return products.value.filter(p => {
        const q = searchQuery.value.toLowerCase()
        const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
        const matchCategory = !selectedCategory.value || p.categoryId === Number(selectedCategory.value)
        const matchStatus = selectedStatus.value === '' || String(p.isActive) === selectedStatus.value
        return matchQuery && matchCategory && matchStatus
    })
})

function formatCurrency(val) {
    if (val === null || val === undefined) return 'Rp 0'
    return 'Rp ' + Number(val).toLocaleString('id-ID')
}

// Konfirmasi hapus menggunakan SweetAlert khusus untuk aksi hapus
async function confirmDelete(product) {
    const result = await Swal.fire({
        title: 'Hapus Produk?',
        text: `Yakin ingin menghapus "${product.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#9b3a2e',
        cancelButtonColor: '#2b1b12',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
        await deleteProduct(product, refreshProducts)
    }
}
</script>

<style scoped>
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
    font-family: 'Space Grotesk', sans-serif;
}

.mono {
    font-family: 'IBM Plex Mono', monospace;
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
</style>