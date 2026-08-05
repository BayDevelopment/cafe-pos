<!-- app/layouts/default.vue -->
<template>
    <div class="min-h-screen bg-[#1c1410] text-[#2b1b12] flex font-sans">

        <!-- OVERLAY untuk Mobile -->
        <div v-if="isSidebarOpen" @click="toggleSidebar"
            class="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity"></div>

        <!-- SIDEBAR -->
        <aside :class="[
            'fixed inset-y-0 left-0 z-50 w-64 bg-[#faf6ee] border-r border-[#b8763c]/20 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 shadow-xl md:shadow-none',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        ]">
            <!-- Header Sidebar -->
            <div class="p-6 border-b border-[#2b1b12]/10 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div
                        class="w-9 h-9 rounded-xl bg-[#2b1b12] text-[#faf6ee] flex items-center justify-center font-bold text-lg shadow-sm">
                        ☕
                    </div>
                    <div>
                        <h1 class="font-bold text-[#2b1b12] tracking-tight leading-none text-base">KEDAI KOPI</h1>
                        <p class="text-[0.65rem] font-mono text-[#8A7A68] uppercase tracking-wider mt-0.5">POS Terminal
                        </p>
                    </div>
                </div>
                <button @click="toggleSidebar" class="md:hidden text-[#8A7A68] hover:text-[#2b1b12]">
                    ✕
                </button>
            </div>

            <!-- Navigasi Menu Kasir -->
            <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto font-mono text-xs">
                <div class="px-3 pb-2 text-[0.6rem] font-bold text-[#8A7A68] uppercase tracking-widest">Menu Kasir</div>

                <NuxtLink to="/kasir/dashboard" @click="closeSidebar"
                    class="flex items-center gap-3 px-3.5 py-3 rounded-lg font-medium text-[#594a3c] hover:bg-[#2b1b12]/5 transition"
                    active-class="bg-[#2b1b12] text-[#faf6ee] shadow-sm">
                    <span>🏠</span> Dashboard Kasir
                </NuxtLink>

                <NuxtLink to="/kasir/product" @click="closeSidebar"
                    class="flex items-center gap-3 px-3.5 py-3 rounded-lg font-medium text-[#594a3c] hover:bg-[#2b1b12]/5 transition"
                    active-class="bg-[#2b1b12] text-[#faf6ee] shadow-sm">
                    <span>📦</span> Produk / POS
                </NuxtLink>
            </nav>

            <!-- Footer Sidebar & Tombol Keluar -->
            <div class="p-4 border-t border-[#2b1b12]/10 bg-[#f4eee3]">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5 overflow-hidden">
                        <div
                            class="w-8 h-8 rounded-full bg-[#b8763c]/20 text-[#b8763c] flex items-center justify-center font-mono font-bold text-xs">
                            OP
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-xs font-bold text-[#2b1b12] truncate">Terminal Aktif</p>
                            <p class="text-[0.65rem] font-mono text-[#8A7A68]">Online</p>
                        </div>
                    </div>
                    <button @click="handleLogout" title="Keluar Sistem"
                        class="p-2 text-[#9b3a2e] hover:bg-[#9b3a2e]/10 rounded-lg transition text-xs font-mono cursor-pointer">
                        ⎋
                    </button>
                </div>
            </div>
        </aside>

        <!-- KONTEN UTAMA -->
        <div class="flex-1 flex flex-col min-w-0 bg-[#f8f5ee] rounded-l-3xl md:rounded-none overflow-hidden shadow-2xl">

            <!-- Topbar Mobile -->
            <header
                class="bg-[#faf6ee] border-b border-[#2b1b12]/10 h-16 flex items-center justify-between px-6 md:hidden sticky top-0 z-30">
                <button @click="toggleSidebar" class="text-[#2b1b12] focus:outline-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span class="font-bold text-[#2b1b12] font-mono text-sm tracking-widest">KEDAI KOPI POS</span>
                <div class="w-6"></div>
            </header>

            <!-- Area Halaman -->
            <main class="flex-1 overflow-y-auto">
                <NuxtPage />
            </main>

        </div>

    </div>
</template>

<script setup>
const isSidebarOpen = ref(false)
const router = useRouter()

const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
    isSidebarOpen.value = false
}

const handleLogout = () => {
    if (confirm('Keluar dari sesi terminal ini?')) {
        router.push('/login')
    }
}
</script>