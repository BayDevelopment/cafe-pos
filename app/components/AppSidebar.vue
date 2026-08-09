<template>
  <div>
    <!-- Overlay (mobile only, muncul saat sidebar terbuka) -->
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        aria-hidden="true"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      class="fixed md:static inset-y-0 left-0 z-50 w-[82vw] max-w-72 md:w-72 md:max-w-none flex-shrink-0 bg-[#1c1410] text-[#f8f5ee] flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl md:shadow-none border-r border-[#f8f5ee]/5"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Brand Header -->
      <div class="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 border-b border-[#f8f5ee]/10 flex-shrink-0">
        <NuxtLink to="/" class="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div class="p-2 rounded-xl bg-[#c9793f]/10 group-hover:bg-[#c9793f]/20 transition-colors flex-shrink-0">
            <LucideCoffee class="w-6 h-6 sm:w-7 sm:h-7 text-[#c9793f]" />
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-bold text-sm sm:text-base tracking-tight text-[#f8f5ee] truncate">KEDAI KOPI</span>
            <span class="text-[10px] sm:text-[11px] font-medium text-[#f8f5ee]/60 -mt-0.5 tracking-wider uppercase truncate">Point of Sale</span>
          </div>
        </NuxtLink>

        <!-- Tombol close, mobile only -->
        <button
          class="md:hidden p-2 rounded-xl text-[#f8f5ee]/60 hover:text-white hover:bg-[#f8f5ee]/10 active:bg-[#f8f5ee]/15 transition-all flex-shrink-0"
          aria-label="Tutup Menu"
          @click="$emit('close')"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigasi -->
      <nav class="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 scrollbar-thin scrollbar-thumb-[#f8f5ee]/10 scrollbar-track-transparent">
        <!-- Skeleton (saat role/menu masih ditentukan dari data user) -->
        <template v-if="userPending">
          <div v-for="n in 2" :key="n" class="space-y-2">
            <div class="mx-3 h-2.5 w-24 rounded-full bg-[#f8f5ee]/10 animate-pulse"></div>
            <div v-for="i in 3" :key="i" class="flex items-center gap-3.5 px-3.5 py-3">
              <div class="w-5 h-5 rounded-md bg-[#f8f5ee]/10 animate-pulse flex-shrink-0"></div>
              <div class="h-3 rounded-full bg-[#f8f5ee]/10 animate-pulse" :style="{ width: `${55 + i * 8}%` }"></div>
            </div>
          </div>
        </template>

        <template v-else>
          <div v-for="group in menuGroups" :key="group.label" class="space-y-2">
            <!-- Group Label -->
            <p class="px-3 text-[11px] font-bold uppercase tracking-wider text-[#f8f5ee]/40 select-none">
              {{ group.label }}
            </p>

            <!-- Menu Items -->
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ease-in-out"
              :class="isActive(item.to)
                ? 'bg-[#c9793f] text-[#1c1410] shadow-md shadow-[#c9793f]/20'
                : 'text-[#f8f5ee]/70 hover:text-white hover:bg-[#f8f5ee]/5 active:bg-[#f8f5ee]/10'"
              @click="$emit('close')"
            >
              <!-- Ikon Lucide -->
              <component
                :is="item.icon"
                class="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105"
                :class="isActive(item.to) ? 'text-[#1c1410]/80' : 'text-[#f8f5ee]/50'"
              />
              <span class="truncate">{{ item.label }}</span>

              <!-- Indikator Aktif (opsional, di kanan) -->
              <div v-if="isActive(item.to)" class="ml-auto w-1.5 h-1.5 rounded-full bg-[#1c1410]/30 flex-shrink-0"></div>
            </NuxtLink>
          </div>
        </template>
      </nav>

      <!-- Profil User Bawah -->
      <div class="px-3 sm:px-4 py-4 sm:py-6 mt-auto border-t border-[#f8f5ee]/10 flex-shrink-0 bg-[#17100d]">
        <div class="flex items-center gap-3 px-3 py-3 rounded-2xl bg-[#f8f5ee]/5 border border-[#f8f5ee]/10">
          <!-- Skeleton (saat data user masih dimuat) -->
          <template v-if="userPending">
            <div class="w-10 h-10 rounded-full bg-[#f8f5ee]/10 animate-pulse flex-shrink-0"></div>
            <div class="flex-1 min-w-0 space-y-2">
              <div class="h-3 w-24 rounded-full bg-[#f8f5ee]/10 animate-pulse"></div>
              <div class="h-2.5 w-14 rounded-full bg-[#f8f5ee]/10 animate-pulse"></div>
            </div>
            <div class="w-6 h-6 rounded-lg bg-[#f8f5ee]/10 animate-pulse flex-shrink-0"></div>
          </template>

          <!-- Konten Asli (setelah data siap) -->
          <template v-else>
            <div class="relative flex-shrink-0">
              <img
                :src="`https://api.dicebear.com/8.x/notionists-neutral/svg?seed=${user?.name || 'user'}&backgroundColor=c9793f`"
                alt="Avatar"
                class="w-10 h-10 rounded-full bg-[#1c1410] border-2 border-[#f8f5ee]/10"
              />
              <span class="absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-[#17100d] bg-emerald-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-white truncate">
                {{ user?.name || 'Memuat...' }}
              </p>
              <p class="text-xs font-medium text-[#c9793f] uppercase tracking-wide truncate">
                Kasir
              </p>
            </div>
          </template>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRequestHeaders, useFetch } from '#imports'
// Ikon diimpor secara otomatis oleh nuxt-lucide-icons

// --- Props & Emits ---
defineProps<{ isOpen: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()

// --- Data Fetching ---
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'KASIR' | 'PEMILIK'
}

// Forward cookie browser ke request SSR untuk autentikasi
const headers = useRequestHeaders(['cookie'])

const { data: user, pending: userPending } = useFetch<AuthUser>('/api/auth/me', {
  headers,
  // Tangani error secara diam-diam jika belum login
  onResponseError: () => {},
})

// --- Computed Properties ---

// Role normalisasi (dipakai untuk menentukan path menu, bukan untuk label footer)
const role = computed<'KASIR' | 'PEMILIK'>(() => {
  const currentRole = user.value?.role?.toUpperCase()
  if (currentRole === 'PEMILIK') return 'PEMILIK'
  if (currentRole === 'KASIR') return 'KASIR'
  // Fallback berdasarkan path URL jika API belum siap
  return route.path.startsWith('/owner') ? 'PEMILIK' : 'KASIR'
})

// --- Konfigurasi Menu ---
const menuGroups = computed(() => [
  {
    label: 'Halaman Utama',
    items: [
      {
        label: 'Ringkasan',
        to: role.value === 'PEMILIK' ? '/owner/dashboard' : '/kasir/dashboard',
        icon: resolveComponent('LucideLayoutGrid'),
      },
      {
        label: 'Kasir (POS)',
        to: '/kasir/pos',
        icon: resolveComponent('LucideMonitorSmartphone'),
      },
    ],
  },
  {
    label: 'Manajemen Kedai',
    items: [
      {
        label: 'Daftar Produk',
        to: role.value === 'PEMILIK' ? '/owner/product' : '/kasir/product',
        icon: resolveComponent('LucidePackage'),
      },
      {
        label: 'Kategori Menu',
        to: role.value === 'PEMILIK' ? '/owner/category' : '/kasir/category',
        icon: resolveComponent('LucideTags'),
      },
      {
        label: 'Riwayat Transaksi',
        to: role.value === 'PEMILIK' ? '/owner/transaksi' : '/kasir/transaksi',
        icon: resolveComponent('LucideReceiptText'),
      },
    ],
  },
  {
    label: 'Analisis & Sistem',
    items: [
      {
        label: 'Laporan Penjualan',
        to: role.value === 'PEMILIK' ? '/owner/laporan' : '/kasir/laporan',
        icon: resolveComponent('LucideBarChartBig'),
      },
      ...(role.value === 'PEMILIK'
        ? [
            {
              label: 'Pengaturan Kedai',
              to: '/owner/pengaturan',
              icon: resolveComponent('LucideSettings'),
            },
          ]
        : []),
    ],
  },
])

// --- Logika Navigasi Aktif ---
const activeTo = computed<string | null>(() => {
  const allPaths = menuGroups.value.flatMap((g) => g.items.map((i) => i.to))
  // Cari path yang paling spesifik (terpanjang) yang cocok dengan URL saat ini
  const matches = allPaths.filter(
    (to) => route.path === to || route.path.startsWith(to + '/')
  )
  if (matches.length === 0) return null
  return matches.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  )
})

function isActive(to: string) {
  return to === activeTo.value
}
</script>

<style scoped>
/* Transisi Overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Kustomisasi Scrollbar Webkit (opsional) */
.scrollbar-thin {
  scrollbar-width: thin;
}
</style>