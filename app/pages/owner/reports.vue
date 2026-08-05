<!-- app/pages/owner/reports.vue -->
<template>
    <div class="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">

        <!-- HEADER LAPORAN -->
        <div class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="mono label-xs px-2 py-0.5 rounded bg-[#9b3a2e] text-[#faf6ee]">OWNER ACCESS</span>
                    <span class="mono label-xs text-[#8A7A68]">REKAPITULASI KEUANGAN</span>
                </div>
                <h1 class="display text-2xl text-[#2b1b12] font-bold">Laporan Penjualan & Omzet</h1>
                <p class="mono text-xs text-[#8A7A68] mt-0.5">Analisis data transaksi masuk dari seluruh terminal kasir.
                </p>
            </div>

            <NuxtLink to="/owner/dashboard" class="mono text-xs text-[#b8763c] hover:underline flex items-center gap-1">
                ← Kembali ke Dashboard
            </NuxtLink>
        </div>

        <!-- LOADING STATE -->
        <div v-if="pending" class="ticket-card p-10 text-center mono text-xs text-[#8A7A68]">
            MEMUAT DATA LAPORAN...
        </div>

        <!-- KONTEN UTAMA LAPORAN -->
        <div v-else class="space-y-6">

            <!-- KARTU RINGKASAN STATISTIK -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">

                <div class="ticket-card p-6">
                    <span class="mono label-xs text-[#8A7A68] block mb-2">TOTAL PENDAPATAN (OMZET)</span>
                    <h2 class="display text-2xl font-bold text-[#2b1b12]">
                        Rp {{ Number(totalRevenue).toLocaleString('id-ID') }}
                    </h2>
                    <p class="mono text-[0.7rem] text-[#2f7a46] mt-1">✓ Terakumulasi dari seluruh pesanan</p>
                </div>

                <div class="ticket-card p-6">
                    <span class="mono label-xs text-[#8A7A68] block mb-2">TOTAL TRANSAKSI SUKSES</span>
                    <h2 class="display text-2xl font-bold text-[#2b1b12]">
                        {{ orders.length }} Pesanan
                    </h2>
                    <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Struk tercetak & tervalidasi</p>
                </div>

                <div class="ticket-card p-6">
                    <span class="mono label-xs text-[#8A7A68] block mb-2">RATA-RATA / TRANSAKSI</span>
                    <h2 class="display text-2xl font-bold text-[#b8763c]">
                        Rp {{ Number(averageOrderValue).toLocaleString('id-ID', { maximumFractionDigits: 0 }) }}
                    </h2>
                    <p class="mono text-[0.7rem] text-[#8A7A68] mt-1">Nilai keranjang rata-rata</p>
                </div>

            </div>

            <!-- TABEL RIWAYAT TRANSAKSI -->
            <div class="ticket-card p-6 md:p-8 space-y-4">
                <h3 class="display text-lg text-[#2b1b12] font-bold flex items-center gap-2">
                    <span>🧾</span> Riwayat Transaksi Terbaru
                </h3>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse font-mono text-xs">
                        <thead>
                            <tr class="border-b border-[#2b1b12]/10 text-[#8A7A68]">
                                <th class="py-3 px-4 font-medium uppercase tracking-wider">ID Struk</th>
                                <th class="py-3 px-4 font-medium uppercase tracking-wider">Waktu</th>
                                <th class="py-3 px-4 font-medium uppercase tracking-wider">Metode</th>
                                <th class="py-3 px-4 font-medium uppercase tracking-wider text-right">Total</th>
                                <th class="py-3 px-4 font-medium uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#2b1b12]/5">
                            <tr v-for="order in orders" :key="order.id" class="hover:bg-[#f4eee3]/50 transition">
                                <td class="py-3.5 px-4 font-bold text-[#2b1b12]">#{{ order.id.slice(0, 8) }}</td>
                                <td class="py-3.5 px-4 text-[#8A7A68]">{{ formatDate(order.createdAt) }}</td>
                                <td class="py-3.5 px-4">
                                    <span
                                        :class="['px-2 py-0.5 rounded text-[0.65rem]', order.paymentMethod === 'CASH' ? 'bg-[#2f7a46]/10 text-[#2f7a46]' : 'bg-[#b8763c]/10 text-[#b8763c]']">
                                        {{ order.paymentMethod }}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4 text-right font-bold text-[#2b1b12]">
                                    Rp {{ Number(order.totalAmount).toLocaleString('id-ID') }}
                                </td>
                                <td class="py-3.5 px-4 text-center">
                                    <NuxtLink :to="`/order/${order.id}`"
                                        class="text-[#b8763c] hover:underline font-semibold">
                                        Detail →
                                    </NuxtLink>
                                </td>
                            </tr>

                            <tr v-if="orders.length === 0">
                                <td colspan="5" class="py-8 text-center text-[#8A7A68]">
                                    Belum ada data riwayat transaksi tercatat di database.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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

// Mengambil data riwayat order dari backend API /api/orders
const { data: response, pending } = await useFetch('/api/orders')
const orders = computed(() => response.value?.data || [])

// Total Pendapatan Keseluruhan
const totalRevenue = computed(() => {
    return orders.value.reduce((sum, order) => sum + Number(order.totalAmount), 0)
})

// Rata-rata Nilai Transaksi
const averageOrderValue = computed(() => {
    if (orders.value.length === 0) return 0
    return totalRevenue.value / orders.value.length
})

const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
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
</style>