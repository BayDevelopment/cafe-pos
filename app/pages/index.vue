<!-- app/pages/index.vue -->
<template>
    <div class="stage min-h-screen relative overflow-hidden">

        <!-- Ambient glow -->
        <div class="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"></div>
        <div class="absolute -bottom-32 -right-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"></div>

        <div class="relative z-10 max-w-5xl mx-auto p-5 md:p-12 space-y-8">

            <!-- HEADER -->
            <div class="ticket-wrap">
                <div class="spike-hole" aria-hidden="true"></div>
                <div class="ticket p-6 md:p-8">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                        <div>
                            <div class="flex items-center gap-2 mb-3">
                                <span class="mono label-xs px-2.5 py-1 rounded-full bg-[#b8763c] text-[#faf6ee]">Guest
                                    Menu</span>
                                <span class="mono label-xs text-[#8A7A68]">{{ today }}</span>
                            </div>
                            <div class="flex items-center gap-2.5">
                                <svg width="28" height="28" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                                    <path d="M6 13h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-7Z" stroke="#B8763C"
                                        stroke-width="1.6" />
                                    <path d="M24 15h2.5a3.5 3.5 0 0 1 0 7H24" stroke="#B8763C" stroke-width="1.6" />
                                    <path d="M4 27h22" stroke="#B8763C" stroke-width="1.6" stroke-linecap="round" />
                                </svg>
                                <h1 class="display text-3xl font-bold text-[#2b1b12] tracking-tight">KEDAI KOPI</h1>
                            </div>
                            <p class="mono text-xs text-[#8A7A68] mt-2">Lihat daftar menu dan ketersediaan produk kami
                                hari ini</p>
                        </div>
                    </div>

                    <!-- Search -->
                    <div class="mt-6 pt-5 border-t border-[#2b1b12]/10">
                        <input v-model="query" type="text" placeholder="Cari menu, misal: kopi susu, croissant…"
                            class="field w-full" aria-label="Cari menu" />
                    </div>
                </div>
            </div>

            <!-- LOADING STATE -->
            <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div v-for="n in 6" :key="n" class="ticket-card p-5 skeleton-card" aria-hidden="true">
                    <div class="skeleton-line w-2/3 h-4 mb-3"></div>
                    <div class="skeleton-line w-1/3 h-3 mb-5"></div>
                    <div class="skeleton-line w-1/2 h-5"></div>
                </div>
            </div>

            <!-- ERROR STATE -->
            <div v-else-if="error" class="ticket-card p-10 text-center">
                <p class="mono text-xs text-[#9b3a2e]">Gagal memuat menu. Silakan muat ulang halaman.</p>
            </div>

            <!-- CATALOG -->
            <div v-else class="space-y-8">

                <div v-if="filteredGroups.length === 0" class="ticket-card p-12 text-center">
                    <p class="mono text-xs text-[#8A7A68]">
                        {{ query ? `Tidak ada menu yang cocok dengan "${query}".` : 'Belum ada produk yang diunggah ke katalog.' }}
                    </p>
                </div>

                <div v-for="group in filteredGroups" :key="group.name" class="space-y-4">
                    <div class="flex items-center gap-3">
                        <h2 class="display text-lg font-bold text-[#faf6ee]">{{ group.name }}</h2>
                        <span class="mono label-xs text-[#8A7A68]">{{ group.items.length }} item</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <div v-for="product in group.items" :key="product.id"
                            class="ticket-card overflow-hidden flex flex-col" :class="{ 'opacity-60': !product.stock }">

                            <div
                                class="h-32 bg-[#f4eee3] flex items-center justify-center border-b border-[#2b1b12]/10">
                                <img v-if="product.image" :src="product.image" :alt="product.name"
                                    class="w-full h-full object-cover" />
                                <svg v-else width="30" height="30" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                                    <path d="M6 13h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-7Z" stroke="#C9B8A2"
                                        stroke-width="1.6" />
                                    <path d="M24 15h2.5a3.5 3.5 0 0 1 0 7H24" stroke="#C9B8A2" stroke-width="1.6" />
                                </svg>
                            </div>

                            <div class="p-5 flex flex-col justify-between flex-1">
                                <div>
                                    <div class="flex justify-between items-start gap-2 mb-2">
                                        <h3 class="display text-base font-bold text-[#2b1b12] leading-snug">{{
                                            product.name }}</h3>
                                        <span :class="['mono label-xs px-2 py-0.5 rounded-full shrink-0',
                                            product.stock > 0 ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#9b3a2e]/10 text-[#9b3a2e]']">
                                            {{ product.stock > 0 ? 'Tersedia' : 'Habis' }}
                                        </span>
                                    </div>
                                    <p class="display text-lg font-bold text-[#b8763c]">
                                        Rp {{ Number(product.price).toLocaleString('id-ID') }}
                                    </p>
                                </div>

                                <div
                                    class="mt-4 pt-3 border-t border-[#2b1b12]/10 flex items-center justify-between mono text-[0.65rem] text-[#8A7A68]">
                                    <span>STOK: {{ product.stock }} UNIT</span>
                                    <span>PESAN KE KASIR</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <footer class="pt-4 pb-2 text-center">
                <p class="mono label-xs text-[#8A7A68]/70">Developed by Bayu Albar Ladici</p>
            </footer>

        </div>
    </div>
</template>

<script setup>
definePageMeta({
    middleware: ['auth'],
    layout: false
})

useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
    ]
})

const { data: response, pending, error } = await useFetch('/api/products')
const products = computed(() => response.value?.data || [])
const query = ref('')

const today = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date())
    .toUpperCase()

// Kelompokkan produk per kategori; produk tanpa kategori masuk ke "Lainnya"
const filteredGroups = computed(() => {
    const q = query.value.trim().toLowerCase()
    const filtered = q
        ? products.value.filter(p => p.name.toLowerCase().includes(q))
        : products.value

    const map = new Map()
    for (const product of filtered) {
        const name = product.category?.name || 'Lainnya'
        if (!map.has(name)) map.set(name, [])
        map.get(name).push(product)
    }

    return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
})
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

.stage {
    background-color: #1c1410;
    background-image: radial-gradient(circle at 1px 1px, rgba(250, 246, 238, 0.05) 1px, transparent 0);
    background-size: 22px 22px;
}

.glow {
    background: radial-gradient(circle, rgba(184, 118, 60, 0.16) 0%, transparent 70%);
    filter: blur(10px);
}

.ticket-wrap {
    position: relative;
    filter: drop-shadow(0 20px 35px rgba(0, 0, 0, 0.45));
}

.spike-hole {
    position: absolute;
    top: -11px;
    left: 40px;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #1c1410;
    border: 1.5px solid #b8763c;
    box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.6);
    z-index: 20;
}

.ticket {
    background: #faf6ee;
    border-radius: 6px;
    position: relative;
}

.ticket-card {
    background: #faf6ee;
    border-radius: 6px;
    border: 1.5px solid rgba(43, 27, 18, 0.12);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    position: relative;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.ticket-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
}

.staff-link {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.66rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8A7A68;
    border: 1.5px solid rgba(43, 27, 18, 0.15);
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
}

.staff-link:hover {
    color: #b8763c;
    border-color: #b8763c;
}

.field {
    background: #f4eee3;
    border: 1.5px solid rgba(43, 27, 18, 0.15);
    border-radius: 6px;
    padding: 0.65rem 0.9rem;
    font-size: 0.85rem;
    font-family: 'IBM Plex Mono', monospace;
    color: #2b1b12;
}

.field::placeholder {
    color: #b3a693;
}

.field:focus {
    outline: none;
    border-color: #b8763c;
}

.field:focus-visible {
    outline: 2px solid #b8763c;
    outline-offset: 2px;
}

.skeleton-card {
    overflow: hidden;
}

.skeleton-line {
    background: linear-gradient(90deg, #ece3d4 25%, #f4eee3 37%, #ece3d4 63%);
    background-size: 400% 100%;
    border-radius: 4px;
    animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}

@media (prefers-reduced-motion: reduce) {

    .skeleton-line,
    .ticket-card {
        animation: none !important;
        transition: none !important;
    }
}
</style>