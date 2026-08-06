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
    class="fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 flex-shrink-0
           bg-[#1c1410] text-[#f8f5ee] flex flex-col
           transform transition-transform duration-300 ease-in-out
           md:translate-x-0"
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

    <!-- Profil / Logout -->
    <div class="px-3 py-4 border-t border-[#f8f5ee]/10 flex-shrink-0">
      <div class="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f8f5ee]/10 transition cursor-pointer">
        <div class="w-9 h-9 rounded-full bg-[#c9793f] flex items-center justify-center text-[#1c1410] font-bold text-sm flex-shrink-0">
          A
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium truncate">Admin Kasir</p>
          <p class="text-xs text-[#f8f5ee]/40 truncate">admin@kedaikopi.id</p>
        </div>
        <button class="text-[#f8f5ee]/40 hover:text-[#f8f5ee] transition" title="Keluar">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useRoute } from '#app'

defineProps<{ isOpen: boolean }>()
defineEmits<{ close: [] }>()

const route = useRoute()

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

// Helper kecil biar tiap ikon jadi functional component ringan (tanpa library icon eksternal)
function icon(paths: string) {
  return () =>
    h(
      'svg',
      { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
      [h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: paths })]
    )
}

const menuGroups = [
  {
    label: 'Utama',
    items: [
      { label: 'Dashboard', to: '/', icon: icon('M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6') },
      { label: 'Kasir', to: '/kasir', icon: icon('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z') },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { label: 'Produk', to: '/produk', icon: icon('M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4') },
      { label: 'Kategori', to: '/kategori', icon: icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10') },
      { label: 'Transaksi', to: '/transaksi', icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4') },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { label: 'Laporan', to: '/laporan', icon: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z') },
      { label: 'Pengaturan', to: '/pengaturan', icon: icon('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z') },
    ],
  },
]
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