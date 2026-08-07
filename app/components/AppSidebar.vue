<!-- app/components/AppSidebar.vue -->
<template>
  <!-- Overlay (mobile only, muncul saat sidebar terbuka) -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      @click="$emit('close')"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    class="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 flex-shrink-0 bg-[#1c1410] text-[#f8f5ee] flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <!-- Brand -->
    <div class="h-16 flex items-center justify-between px-6 border-b border-[#f8f5ee]/10 flex-shrink-0">
      <NuxtLink to="/" class="flex items-center gap-2 font-mono text-sm font-bold tracking-widest">
        <span class="text-lg">☕</span>
        <span>KEDAI KOPI POS</span>
      </NuxtLink>
      <!-- Tombol close, mobile only -->
      <button
        class="md:hidden p-1.5 rounded-lg text-[#f8f5ee]/70 hover:text-[#f8f5ee] hover:bg-[#f8f5ee]/10 transition"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Navigasi -->
    <nav class="flex-1 overflow-y-auto px-3 py-6 space-y-6">
      <div v-for="group in menuGroups" :key="group.label" class="space-y-1">
        <p class="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#f8f5ee]/40">
          {{ group.label }}
        </p>

        <NuxtLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-[#c9793f] text-[#1c1410]'
            : 'text-[#f8f5ee]/70 hover:text-[#f8f5ee] hover:bg-[#f8f5ee]/10'"
          @click="$emit('close')"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Profil -->
    <div class="px-3 py-4 border-t border-[#f8f5ee]/10 flex-shrink-0">
      <div class="px-3 py-2.5 rounded-xl bg-[#f8f5ee]/5 text-center">
        <p class="text-sm font-semibold text-[#f8f5ee]/90 tracking-wider uppercase">
          {{ roleLabel }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { h, computed, markRaw } from 'vue'
import { useRoute, useRequestHeaders, useFetch } from '#imports'

defineProps<{ isOpen: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()

// Ambil data user yang sedang login dari /api/auth/me
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'KASIR' | 'PEMILIK'
}

// Forward cookie browser ke request SSR
const headers = useRequestHeaders(['cookie'])

const { data: user } = useFetch<AuthUser>('/api/auth/me', {
  headers,
  onResponseError: () => {},
})

// Role normalisasi agar case-insensitive (mendukung uppercase/lowercase dari API)
const role = computed<'KASIR' | 'PEMILIK'>(() => {
  const currentRole = user.value?.role?.toUpperCase()
  if (currentRole === 'PEMILIK') return 'PEMILIK'
  if (currentRole === 'KASIR') return 'KASIR'
  return route.path.startsWith('/owner') ? 'PEMILIK' : 'KASIR'
})

const roleLabel = computed(() =>
  role.value === 'PEMILIK' ? 'Pemilik' : 'Kasir'
)

// Helper untuk membuat ikon SVG dengan markRaw
function icon(paths: string) {
  return markRaw(() =>
    h(
      'svg',
      { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
      [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: paths })]
    )
  )
}

const menuGroups = computed(() => [
  {
    label: 'Utama',
    items: [
      {
        label: 'Dashboard',
        to: role.value === 'PEMILIK' ? '/owner/dashboard' : '/kasir/dashboard',
        icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'),
      },
      {
        label: 'Pos',
        to: '/kasir/pos',
        icon: icon('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'),
      },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      {
        label: 'Produk',
        to: role.value === 'PEMILIK' ? '/owner/product' : '/kasir/product',
        icon: icon('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'),
      },
      {
        label: 'Kategori',
        to: role.value === 'PEMILIK' ? '/owner/category' : '/kasir/category',
        icon: icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'),
      },
      {
        label: 'Transaksi',
        to: role.value === 'PEMILIK' ? '/owner/transaksi' : '/kasir/transaksi',
        icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
      },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      {
        label: 'Laporan',
        to: role.value === 'PEMILIK' ? '/owner/laporan' : '/kasir/laporan',
        icon: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
      },
      // Menu Pengaturan hanya untuk PEMILIK
      ...(role.value === 'PEMILIK'
        ? [
            {
              label: 'Pengaturan',
              to: '/owner/pengaturan',
              icon: icon(
                'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              ),
            },
          ]
        : []),
    ],
  },
])

// Cari SATU item dengan prefix path paling spesifik (terpanjang) yang match
const activeTo = computed<string | null>(() => {
  const allPaths = menuGroups.value.flatMap((g) => g.items.map((i) => i.to))
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>