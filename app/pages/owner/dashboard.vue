<!-- app/pages/owner/dashboard.vue -->
<template>
    <div class="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">

        <!-- HEADER KARTU OWNER -->
        <div class="ticket-card p-6 md:p-8 relative overflow-hidden">
            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#b8763c]/10 pointer-events-none blur-2xl">
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="mono label-xs px-2 py-0.5 rounded bg-[#9b3a2e] text-[#faf6ee]">
                            OWNER ACCESS {{ user?.id ? `(ID: ${user.id})` : '' }}
                        </span>
                        <span class="mono label-xs text-[#8A7A68]">{{ today }}</span>
                    </div>
                    <h1 class="display text-2xl md:text-3xl text-[#2b1b12] tracking-tight font-bold">Dashboard Pemilik
                        Toko</h1>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Pantau rekapitulasi keuangan dan performa bisnis kafe
                        secara keseluruhan.</p>
                </div>

                <div class="flex items-center gap-3">
                    <NuxtLink to="/owner/reports" class="btn-stamp mono inline-flex items-center gap-2 no-underline">
                        <span>📊</span> LIHAT LAPORAN OMZET
                    </NuxtLink>
                    <button @click="handleLogout" class="btn-logout mono inline-flex items-center gap-2">
                        <span>🚪</span> KELUAR
                    </button>
                </div>
            </div>
        </div>

        <!-- GRID STATISTIK OWNER -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <!-- Ringkasan Cepat Omzet -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]">TOTAL PENDAPATAN</span>
                    <span class="mono text-xs text-[#b8763c]">💰</span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-2xl text-[#2b1b12] font-bold">Buka Menu Laporan</h2>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Klik tombol laporan untuk rincian lengkap</p>
            </div>

            <!-- Status Kontrol -->
            <div class="ticket-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="mono label-xs text-[#8A7A68]"> HAK AKSES SISTEM</span>
                    <span class="w-2.5 h-2.5 rounded-full bg-[#2f7a46]"></span>
                </div>
                <div class="flex items-baseline gap-2">
                    <h2 class="display text-2xl text-[#2b1b12] font-bold">FULL CONTROL</h2>
                </div>
                <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Akses penuh ke seluruh terminal kasir</p>
            </div>

        </div>

        <!-- PINTASAN MENU OWNER -->
        <div class="ticket-card p-6 md:p-8">
            <h3 class="display text-lg text-[#2b1b12] font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Pintasan Manajemen Pemilik
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

                <NuxtLink to="/owner/reports"
                    class="quick-link p-5 rounded-lg border border-[#2b1b12]/10 bg-white/40 hover:bg-[#faf6ee] transition block group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#b8763c]">MODUL LAPORAN</span>
                        <span class="text-sm group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <h4 class="display text-base text-[#2b1b12] font-bold">Laporan & Riwayat Transaksi</h4>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Periksa rekapitulasi omzet harian dan detail pesanan
                        dari semua kasir.</p>
                </NuxtLink>

                <NuxtLink to="/kasir/product"
                    class="quick-link p-5 rounded-lg border border-[#2b1b12]/10 bg-white/40 hover:bg-[#faf6ee] transition block group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="mono label-xs text-[#b8763c]">MODUL PRODUK</span>
                        <span class="text-sm group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                    <h4 class="display text-base text-[#2b1b12] font-bold">Manajemen & Stok Menu</h4>
                    <p class="mono text-xs text-[#8A7A68] mt-1">Kelola daftar menu makanan, minuman, dan ketersediaan
                        stok kafe.</p>
                </NuxtLink>

            </div>
        </div>

    </div>
</template>

<script setup>
// Daftarkan route middleware untuk memproteksi halaman ini
definePageMeta({
    middleware: [
        async (to, from) => {
            const { user, fetchUser } = useAuth()

            // Jika state user belum ada di frontend, ambil dulu dari API /api/auth/me
            if (!user.value) {
                await fetchUser()
            }

            // Jika belum login, tendang ke halaman login owner
            if (!user.value) {
                return navigateTo('/owner/login')
            }

            // Validasi ketat role: Jika bukan PEMILIK (misal kasir nyasar kesini), alihkan ke dashboard kasir
            if (user.value.role !== 'PEMILIK') {
                return navigateTo('/kasir/dashboard')
            }
        }
    ]
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
</style>