<!-- app/pages/kasir/dashboard.vue -->
<template>
    <div class="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">

        <!-- HEADER / KARTU SELAMAT DATANG (Gaya Ticket Slip) -->
        <div class="ticket-card p-6 md:p-8 relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#b8763c]/10 pointer-events-none blur-2xl">
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">
                            KASIR TERMINAL-01 {{ user?.id ? `(ID: ${user.id})` : '' }}
                        </span>
                        <span class="mono label-xs text-[#8A7A68]">{{ today }}</span>
                    </div>
                    <h1 class="display text-2xl md:text-3xl text-[#2b1b12] tracking-tight font-bold">Dashboard Kasir
                    </h1>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Siap melayani pesanan pelanggan hari ini dengan cepat
                        dan akurat.</p>
                </div>

                <div class="flex items-center gap-3">
                    <NuxtLink to="/kasir/product" class="btn-stamp mono inline-flex items-center gap-2 no-underline">
                        <span>⚡</span> BUKA MESIN POS / MENU
                    </NuxtLink>
                    <button @click="handleLogout" class="btn-logout mono inline-flex items-center gap-2">
                        <span>🚪</span> KELUAR
                    </button>
                </div>
            </div>
        </div>

        <!-- GRID STATISTIK / SLIP RINGKASAN -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <!-- Total Pesanan Hari Ini -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">PESANAN HARI INI</span>
                    <span class="stat-icon">🧾</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-3xl text-[#2b1b12] font-bold">{{ totalPesananHariIni }}</h2>
                    <span class="mono text-xs text-[#2f7a46] font-semibold">+{{ pesananGrowth }}%</span>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Dibanding kemarin</p>
            </div>

            <!-- Total Produk -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">TOTAL PRODUK</span>
                    <span class="stat-icon">☕</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-3xl text-[#2b1b12] font-bold">{{ totalProduk }}</h2>
                    <span class="mono text-xs text-[#8A7A68] font-semibold">item</span>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Aktif di katalog menu</p>
            </div>

            <!-- Total Karyawan -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">TOTAL KARYAWAN</span>
                    <span class="stat-icon">👥</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-3xl text-[#2b1b12] font-bold">{{ totalKaryawan }}</h2>
                    <span class="mono text-xs text-[#8A7A68] font-semibold">orang</span>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Terdaftar & aktif shift</p>
            </div>

        </div>

        <!-- CARD GRAFIK -->
        <div class="ticket-card p-6 md:p-8">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="display text-lg text-[#2b1b12] font-bold flex items-center gap-2">
                        <span>📈</span> Tren Pesanan 7 Hari Terakhir
                    </h3>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Jumlah transaksi tercatat per hari</p>
                </div>
                <div class="text-right">
                    <p class="mono label-xs text-[#8A7A68]">RATA-RATA / HARI</p>
                    <p class="display text-xl text-[#2b1b12] font-bold">{{ rataRataPesanan }}</p>
                </div>
            </div>

            <!-- Bar chart custom (SVG, tanpa dependency tambahan) -->
            <div class="chart-wrap">
                <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-56" preserveAspectRatio="none">
                    <!-- garis bantu horizontal -->
                    <line v-for="n in 4" :key="'grid-' + n" :x1="0" :x2="chartWidth"
                        :y1="(chartHeight - 24) * (n / 4)" :y2="(chartHeight - 24) * (n / 4)"
                        stroke="#2b1b12" stroke-opacity="0.06" stroke-width="1" />

                    <!-- batang -->
                    <g v-for="(item, i) in weeklyData" :key="item.day">
                        <rect
                            :x="i * barSlot + barSlot * 0.22"
                            :y="(chartHeight - 24) - barHeight(item.total)"
                            :width="barSlot * 0.56"
                            :height="barHeight(item.total)"
                            rx="4"
                            :fill="item.day === today3 ? '#b8763c' : '#2b1b12'"
                            :fill-opacity="item.day === today3 ? 1 : 0.85"
                        />
                        <text
                            :x="i * barSlot + barSlot / 2"
                            :y="(chartHeight - 24) - barHeight(item.total) - 8"
                            text-anchor="middle"
                            class="chart-value"
                        >{{ item.total }}</text>
                        <text
                            :x="i * barSlot + barSlot / 2"
                            :y="chartHeight - 4"
                            text-anchor="middle"
                            class="chart-label"
                        >{{ item.day }}</text>
                    </g>
                </svg>
            </div>
        </div>

        <!-- PANDUAN / PINTASAN CEPAT KASIR -->
        <div class="ticket-card p-6 md:p-8">
            <h3 class="display text-lg text-[#2b1b12] font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Pintasan Tugas Kasir
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <NuxtLink to="/kasir/product"
                    class="quick-link p-5 rounded-lg border border-[#2b1b12]/10 bg-white/40 hover:bg-[#faf6ee] transition block group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#b8763c]">MODUL 01</span>
                        <span class="text-sm group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <h4 class="display text-base text-[#2b1b12] font-bold">Katalog Produk & Kasir (POS)</h4>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Pilih menu, masukkan jumlah pesanan, hitung kembalian,
                        dan cetak struk.</p>
                </NuxtLink>

                <div class="p-5 rounded-lg border border-[#2b1b12]/10 bg-white/20 opacity-70 block">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#8A7A68]">INFO PENTING</span>
                        <span class="mono text-[0.65rem] text-[#9b3a2e] font-semibold">RESTRICTED</span>
                    </div>
                    <h4 class="display text-base text-[#2b1b12] font-bold">Laporan Omzet & Keuangan</h4>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Laporan rekapitulasi harian hanya dapat diakses melalui
                        akun Pemilik Toko (Owner).</p>
                </div>

            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
// Menggunakan middleware global auth.ts yang sudah Anda buat
definePageMeta({
    middleware: ['auth']
})

// Gunakan composable useAuth untuk ambil data user & fungsi logout
const { user, logout } = useAuth()

useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
    ]
})

const today = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date())
    .toUpperCase()

// --- Statistik ringkasan ---
// TODO: ganti dengan data asli dari API/composable (mis. useDashboard(), useProduk(), useKaryawan())
const totalPesananHariIni = ref(14)
const pesananGrowth = ref(8)
const totalProduk = ref(48)
const totalKaryawan = ref(6)

// --- Data grafik 7 hari terakhir ---
// TODO: ganti dengan data asli dari API (mis. GET /api/laporan/pesanan-mingguan)
const weeklyData = ref([
    { day: 'Sen', total: 9 },
    { day: 'Sel', total: 12 },
    { day: 'Rab', total: 7 },
    { day: 'Kam', total: 15 },
    { day: 'Jum', total: 18 },
    { day: 'Sab', total: 21 },
    { day: 'Min', total: 14 },
])

const today3 = computed(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return days[new Date().getDay()]
})

const rataRataPesanan = computed(() => {
    const sum = weeklyData.value.reduce((acc, d) => acc + d.total, 0)
    return Math.round(sum / weeklyData.value.length)
})

// --- Ukuran & skala chart (SVG viewBox statis, otomatis scale via CSS) ---
const chartWidth = 700
const chartHeight = 240
const barSlot = computed(() => chartWidth / weeklyData.value.length)
const maxTotal = computed(() => Math.max(...weeklyData.value.map(d => d.total), 1))

function barHeight(total: number) {
    const maxBarHeight = chartHeight - 24 - 28 // sisakan ruang untuk label atas & bawah
    return (total / maxTotal.value) * maxBarHeight
}

const handleLogout = async () => {
    await logout()
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
    border-radius: 6px;
    border: 1.5px solid rgba(43, 27, 18, 0.12);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    position: relative;
}

.stat-icon {
    font-size: 0.9rem;
    opacity: 0.7;
}

.btn-stamp {
    background: #2b1b12;
    color: #faf6ee;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 0.75rem 1.25rem;
    border-radius: 4px;
    border: 1.5px solid #2b1b12;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.12s ease, background 0.15s ease;
}

.btn-stamp:hover {
    background: #b8763c;
    border-color: #b8763c;
    transform: rotate(-0.6deg) scale(1.01);
}

.btn-logout {
    background: transparent;
    color: #9b3a2e;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border: 1.5px solid rgba(155, 58, 46, 0.3);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-logout:hover {
    background: rgba(155, 58, 46, 0.08);
    border-color: #9b3a2e;
}

.quick-link:hover {
    border-color: #b8763c;
}

.chart-wrap {
    width: 100%;
}

.chart-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    fill: #2b1b12;
}

.chart-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    fill: #8A7A68;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
</style>