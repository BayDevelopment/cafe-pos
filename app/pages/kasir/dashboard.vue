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
                        <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">KASIR
                            TERMINAL-01</span>
                        <span class="mono label-xs text-[#8A7A68]">{{ today }}</span>
                    </div>
                    <h1 class="display text-2xl md:text-3xl text-[#2b1b12] tracking-tight font-bold">Dashboard Kasir
                    </h1>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Siap melayani pesanan pelanggan hari ini dengan cepat
                        dan akurat.</p>
                </div>

                <NuxtLink to="/kasir/product" class="btn-stamp mono inline-flex items-center gap-2 no-underline">
                    <span>⚡</span> BUKA MESIN POS / MENU
                </NuxtLink>
            </div>
        </div>

        <!-- GRID STATISTIK / SLIP RINGKASAN -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <!-- Status Kasir -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">STATUS OPERASIONAL</span>
                    <span class="w-2.5 h-2.5 rounded-full bg-[#2f7a46] animate-pulse"></span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-2xl text-[#2b1b12] font-bold">AKTIF</h2>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Koneksi database & printer normal</p>
            </div>

            <!-- Total Transaksi Hari Ini -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">TRANSAKSI HARI INI</span>
                    <span class="mono text-xs text-[#b8763c]">🧾</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-2xl text-[#2b1b12] font-bold">{{ totalTransaksi }} Pesanan</h2>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Tercatat di shift kasir ini</p>
            </div>

            <!-- Waktu Shift -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">WAKTU SISTEM</span>
                    <span class="mono text-xs text-[#8A7A68]">🕒</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-2xl text-[#2b1b12] font-bold">{{ currentTime }}</h2>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Waktu Lokal Terminal</p>
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

<script setup>
// Menggunakan font yang sama persis dengan halaman login via useHead
useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
    ]
})

const currentTime = ref('')
const totalTransaksi = ref(14) // Contoh data statis ringkas, bisa dihubungkan ke API database nanti

const today = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date())
    .toUpperCase()

onMounted(() => {
    const updateTime = () => {
        currentTime.value = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    updateTime()
    setInterval(updateTime, 1000)
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

/* Gaya Kartu Kertas Resi / Ticket */
.ticket-card {
    background: #faf6ee;
    border-radius: 6px;
    border: 1.5px solid rgba(43, 27, 18, 0.12);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    position: relative;
}

/* Tombol Stempel Khas Login */
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

.quick-link:hover {
    border-color: #b8763c;
}
</style>