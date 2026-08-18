<template>
    <div class="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">

        <!-- HEADER / KARTU SELAMAT DATANG -->
        <div class="ticket-card p-6 md:p-8 relative overflow-hidden bg-[#faf6ee] text-[#1c1410]">
            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#c9793f]/10 pointer-events-none blur-2xl">
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="mono label-xs text-[#1c1410]/60">{{ today }}</span>
                        <span v-if="pending" class="mono text-[10px] text-[#c9793f] flex items-center gap-1.5 animate-pulse font-semibold">
                            <LucideLoader2 class="w-3 h-3 animate-spin" /> Memperbarui data...
                        </span>
                    </div>
                    <h1 class="display text-2xl md:text-3xl text-[#1c1410] tracking-tight font-bold">
                        Dashboard Kasir
                    </h1>
                    <p class="mono text-xs text-[#1c1410]/70 mt-1">
                        Siap melayani pesanan pelanggan hari ini dengan cepat dan akurat.
                    </p>
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto">
                    <NuxtLink to="/kasir/pos" class="btn-stamp mono inline-flex items-center gap-2 no-underline flex-1 md:flex-initial justify-center">
                        <LucideMonitorSmartphone class="w-4 h-4 text-[#c9793f]" />
                        <span>BUKA MESIN POS</span>
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- GRID STATISTIK DENGAN SKELETON -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- 1. Pesanan Hari Ini -->
            <div class="ticket-card p-6 bg-[#faf6ee]">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#1c1410]/60">PESANAN HARI INI</span>
                    <div class="p-2 rounded-xl bg-[#c9793f]/10 text-[#c9793f]">
                        <LucideReceiptText class="w-5 h-5" />
                    </div>
                </div>
                <div v-if="pending && stats.totalPesananHariIni === 0" class="space-y-2 py-1">
                    <div class="skeleton h-8 w-20 rounded-lg"></div>
                    <div class="skeleton h-3 w-28 rounded"></div>
                </div>
                <div v-else>
                    <div class="flex items-baseline gap-2">
                        <h2 class="display text-3xl text-[#1c1410] font-bold">{{ stats.totalPesananHariIni }}</h2>
                        <span class="mono text-xs font-semibold" :class="stats.pesananGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'">
                            {{ stats.pesananGrowth >= 0 ? '+' : '' }}{{ stats.pesananGrowth }}%
                        </span>
                    </div>
                    <p class="mono text-[0.7rem] text-[#1c1410]/60 mt-1">Dibanding kemarin</p>
                </div>
            </div>

            <!-- 2. Total Produk -->
            <div class="ticket-card p-6 bg-[#faf6ee]">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#1c1410]/60">TOTAL PRODUK</span>
                    <div class="p-2 rounded-xl bg-[#1c1410]/5 text-[#1c1410]/80">
                        <LucidePackage class="w-5 h-5" />
                    </div>
                </div>
                <div v-if="pending && stats.totalProduk === 0" class="space-y-2 py-1">
                    <div class="skeleton h-8 w-20 rounded-lg"></div>
                    <div class="skeleton h-3 w-28 rounded"></div>
                </div>
                <div v-else>
                    <div class="flex items-baseline gap-2">
                        <h2 class="display text-3xl text-[#1c1410] font-bold">{{ stats.totalProduk }}</h2>
                        <span class="mono text-xs text-[#1c1410]/60 font-semibold">item</span>
                    </div>
                    <p class="mono text-[0.7rem] text-[#1c1410]/60 mt-1">Aktif di katalog menu</p>
                </div>
            </div>

            <!-- 3. Total Karyawan -->
            <div class="ticket-card p-6 bg-[#faf6ee]">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#1c1410]/60">TOTAL KARYAWAN</span>
                    <div class="p-2 rounded-xl bg-[#1c1410]/5 text-[#1c1410]/80">
                        <LucideUsers class="w-5 h-5" />
                    </div>
                </div>
                <div v-if="pending && stats.totalKaryawan === 0" class="space-y-2 py-1">
                    <div class="skeleton h-8 w-20 rounded-lg"></div>
                    <div class="skeleton h-3 w-28 rounded"></div>
                </div>
                <div v-else>
                    <div class="flex items-baseline gap-2">
                        <h2 class="display text-3xl text-[#1c1410] font-bold">{{ stats.totalKaryawan }}</h2>
                        <span class="mono text-xs text-[#1c1410]/60 font-semibold">orang</span>
                    </div>
                    <p class="mono text-[0.7rem] text-[#1c1410]/60 mt-1">Terdaftar & aktif shift</p>
                </div>
            </div>
        </div>

        <!-- CARD GRAFIK DENGAN SKELETON -->
        <div class="ticket-card p-6 md:p-8 bg-[#faf6ee]">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 class="display text-lg text-[#1c1410] font-bold flex items-center gap-2">
                        <LucideTrendingUp class="w-5 h-5 text-[#c9793f]" /> 
                        <span>Tren Pesanan 7 Hari Terakhir</span>
                    </h3>
                    <p class="mono text-xs text-[#1c1410]/60 mt-1">Jumlah transaksi tercatat per hari secara real-time dari database</p>
                </div>
                <div class="text-left sm:text-right bg-[#1c1410]/5 px-4 py-2 rounded-xl border border-[#1c1410]/10 w-full sm:w-auto">
                    <p class="mono label-xs text-[#1c1410]/60">RATA-RATA / HARI</p>
                    <p class="display text-xl text-[#1c1410] font-bold">
                        <span v-if="pending && rataRataPesanan === 0" class="skeleton inline-block h-6 w-12 rounded"></span>
                        <span v-else>{{ rataRataPesanan }}</span>
                    </p>
                </div>
            </div>

            <!-- Bar chart custom (SVG) atau Skeleton Chart -->
            <div class="chart-wrap overflow-x-auto relative">
                <div v-if="pending && (!stats.weeklyData || stats.weeklyData.every(d => d.total === 0))" class="w-full h-56 flex items-end justify-between gap-4 px-4 py-6 min-w-[500px]">
                    <div v-for="n in 7" :key="'sk-bar-' + n" class="w-full flex flex-col items-center gap-2 h-full justify-end">
                        <div class="skeleton w-full rounded-md" :style="`height: ${Math.floor(Math.random() * 60) + 30}%`"></div>
                        <div class="skeleton h-3 w-8 rounded"></div>
                    </div>
                </div>
                <svg v-else :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="w-full h-56 min-w-[500px]" preserveAspectRatio="none">
                    <line v-for="n in 4" :key="'grid-' + n" :x1="0" :x2="chartWidth"
                        :y1="topPadding + (usableHeight * (n / 4))" :y2="topPadding + (usableHeight * (n / 4))"
                        stroke="#1c1410" stroke-opacity="0.08" stroke-width="1" />

                    <g v-for="(item, i) in stats.weeklyData" :key="item.day">
                        <rect
                            :x="i * barSlot + barSlot * 0.22"
                            :y="topPadding + usableHeight - barHeight(item.total)"
                            :width="barSlot * 0.56"
                            :height="Math.max(barHeight(item.total), 4)"
                            rx="6"
                            :fill="item.day === today3 ? '#c9793f' : '#1c1410'"
                            :fill-opacity="item.day === today3 ? 1 : 0.75"
                            class="transition-all duration-300 hover:opacity-100 cursor-pointer"
                        />
                        <text
                            :x="i * barSlot + barSlot / 2"
                            :y="topPadding + usableHeight - barHeight(item.total) - 8"
                            text-anchor="middle"
                            class="chart-value"
                        >{{ item.total }}</text>
                        <text
                            :x="i * barSlot + barSlot / 2"
                            :y="chartHeight - 8"
                            text-anchor="middle"
                            class="chart-label"
                        >{{ item.day }}</text>
                    </g>
                </svg>
            </div>
        </div>

        <!-- PANDUAN / PINTASAN CEPAT KASIR -->
        <div class="ticket-card p-6 md:p-8 bg-[#faf6ee]">
            <h3 class="display text-lg text-[#1c1410] font-bold mb-4 flex items-center gap-2">
                <LucideCompass class="w-5 h-5 text-[#c9793f]" />
                <span>Pintasan Tugas Kasir</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NuxtLink to="/kasir/pos"
                    class="quick-link p-5 rounded-2xl border border-[#1c1410]/10 bg-white/40 hover:bg-[#f3ede2] transition-all block group shadow-sm">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#c9793f] font-bold">MODUL 01</span>
                        <LucideArrowRight class="w-4 h-4 text-[#1c1410]/60 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h4 class="display text-base text-[#1c1410] font-bold">Katalog Produk & Kasir (POS)</h4>
                    <p class="mono text-xs text-[#1c1410]/60 mt-1">Pilih menu, masukkan jumlah pesanan, hitung kembalian, dan cetak struk.</p>
                </NuxtLink>

                <div class="p-5 rounded-2xl border border-[#1c1410]/10 bg-white/20 opacity-75 block">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#1c1410]/50">INFO PENTING</span>
                        <span class="mono text-[0.65rem] text-rose-700 font-bold px-2 py-0.5 rounded bg-rose-500/10">RESTRICTED</span>
                    </div>
                    <h4 class="display text-base text-[#1c1410] font-bold">Laporan Omzet & Keuangan</h4>
                    <p class="mono text-xs text-[#1c1410]/60 mt-1">Laporan rekapitulasi harian hanya dapat diakses melalui akun Pemilik Toko (Owner).</p>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

definePageMeta({
    middleware: ['auth']
})

useHead({
  title: 'Dashboard - POS Kasir'
})


const { logout } = useAuth()
const { stats, pending, fetchDashboardData, startPolling, stopPolling } = useDashboard(15000)

await useAsyncData('dashboard-init', async () => {
  await fetchDashboardData()
  return true
})

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})


const today = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date())
    .toUpperCase()

const today3 = computed(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    return days[new Date().getDay()]
})

const rataRataPesanan = computed(() => {
    if (!stats.value.weeklyData || stats.value.weeklyData.length === 0) return 0
    const sum = stats.value.weeklyData.reduce((acc, d) => acc + d.total, 0)
    return Math.round(sum / stats.value.weeklyData.length)
})

const chartWidth = 700
const chartHeight = 240
const topPadding = 25
const bottomPadding = 30
const usableHeight = chartHeight - topPadding - bottomPadding

const barSlot = computed(() => chartWidth / (stats.value.weeklyData?.length || 7))
const maxTotal = computed(() => Math.max(...(stats.value.weeklyData?.map(d => d.total) || [1]), 1))

function barHeight(total: number) {
    return (total / maxTotal.value) * (usableHeight - 15)
}

const handleLogout = async () => {
    stopPolling()
    await logout()
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

/* Efek Animasi Skeleton Shimmer */
@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

.skeleton {
    background: linear-gradient(90deg, rgba(28, 20, 16, 0.06) 25%, rgba(28, 20, 16, 0.12) 37%, rgba(28, 20, 16, 0.06) 63%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease infinite;
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

.btn-stamp:hover {
    background: #c9793f;
    border-color: #c9793f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(201, 121, 63, 0.25);
}

.quick-link:hover {
    border-color: #c9793f;
}

.chart-wrap {
    width: 100%;
}

.chart-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    fill: #1c1410;
}

.chart-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    fill: #1c1410;
    opacity: 0.6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}
</style>