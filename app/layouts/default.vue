<!-- app/layouts/default.vue -->
<template>
  <div class="h-screen bg-[#1c1410] text-[#2b1b12] flex font-sans overflow-hidden">

    <!-- COMPONENTS SIDEBAR -->
    <AppSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />

    <!-- KONTEN UTAMA -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#f8f5ee] rounded-l-3xl md:rounded-none overflow-hidden shadow-2xl">

      <!-- TOPBAR (mobile + desktop) - Tetap Fixed/Sticky di Atas -->
      <header
        class="h-16 bg-[#faf6ee] border-b border-[#2b1b12]/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 flex-shrink-0">
        <!-- Kiri: hamburger (mobile) + brand / greeting -->
        <div class="flex items-center gap-3 min-w-0">
          <button
            class="md:hidden text-[#2b1b12] focus:outline-none p-1.5 rounded-lg hover:bg-[#2b1b12]/5 transition flex-shrink-0"
            aria-label="Buka menu" @click="isSidebarOpen = !isSidebarOpen">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="md:hidden font-bold text-[#2b1b12]  text-sm tracking-widest truncate">
            KEDAI KOPI POS
          </span>
          <span class="hidden md:inline  text-xs text-[#8A7A68] tracking-wide truncate">
            <template v-if="pendingUser">Memuat data pengguna...</template>
            <template v-else>Selamat datang kembali, {{ firstName }} 👋</template>
          </span>
        </div>

        <!-- Kanan: profile dropdown -->
        <div ref="profileMenuRef" class="relative flex-shrink-0">
          <!-- Skeleton (saat data user masih dimuat) -->
          <div v-if="pendingUser" class="flex items-center gap-2 md:gap-3 pl-1.5 md:pl-2 pr-1.5 md:pr-3 py-1.5">
            <div class="w-9 h-9 rounded-full bg-[#2b1b12]/10 animate-pulse flex-shrink-0"></div>
            <div class="hidden sm:block space-y-1.5">
              <div class="h-3 w-24 rounded-full bg-[#2b1b12]/10 animate-pulse"></div>
              <div class="h-2.5 w-32 rounded-full bg-[#2b1b12]/10 animate-pulse"></div>
            </div>
          </div>

          <!-- Tombol Profil (setelah data siap) -->
          <button v-else
            class="flex items-center gap-2 md:gap-3 pl-1.5 md:pl-2 pr-1.5 md:pr-3 py-1.5 rounded-full hover:bg-[#2b1b12]/5 transition"
            @click="isProfileOpen = !isProfileOpen">
            <div
              class="w-9 h-9 rounded-full bg-[#b8763c] text-[#faf6ee] flex items-center justify-center font-bold text-sm flex-shrink-0">
              {{ initials }}
            </div>
            <div class="hidden sm:block text-left leading-tight max-w-[160px]">
              <p class="text-sm font-semibold text-[#2b1b12] truncate">{{ fullName }}</p>
              <p class="text-xs text-[#8A7A68] truncate">{{ email }}</p>
            </div>
            <svg class="w-4 h-4 text-[#8A7A68] transition-transform hidden sm:block"
              :class="isProfileOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown menu -->
          <Transition name="dropdown">
            <div v-if="isProfileOpen"
              class="absolute right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-[#faf6ee] rounded-xl border border-[#2b1b12]/10 shadow-2xl py-2 z-50">
              <div class="px-4 py-3 border-b border-[#2b1b12]/10">
                <p class="text-sm font-semibold text-[#2b1b12] truncate">{{ fullName }}</p>
                <p class="text-xs text-[#8A7A68] truncate">{{ email }}</p>
              </div>

              <!-- Ubah path ke /profile sesuai nama file profile.vue Anda -->
              <NuxtLink to="/kasir/profile"
                class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2b1b12] hover:bg-[#2b1b12]/5 transition"
                @click="isProfileOpen = false">
                <svg class="w-4 h-4 text-[#8A7A68]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil Saya
              </NuxtLink>

              <button
                class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#9b3a2e] hover:bg-[#9b3a2e]/5 transition"
                @click="handleLogout">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Keluar
              </button>
            </div>
          </Transition>
        </div>
      </header>

      <!-- AREA SCROLL UTAMA (Menampung Slot & Footer) -->
      <main class="flex-1 overflow-y-auto flex flex-col">
        <!-- Wrapper Konten: Mendorong footer ke bawah jika konten sedikit -->
        <div class="flex-1">
          <slot />
        </div>

        <!-- FOOTER: Atas-bawah di Mobile & Tablet, Menyamping di Desktop -->
        <footer
          class="flex-shrink-0 border-t border-[#2b1b12]/10 bg-[#faf6ee] px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs  text-[#8A7A68] text-center md:text-left">
          <span>© {{ currentYear }} Kedai Kopi POS. Seluruh hak cipta dilindungi.</span>
          <span>v1.0.0 · Dibuat di Indonesia</span>
        </footer>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '~/components/AppSidebar.vue'

const isSidebarOpen = ref(false)
const isProfileOpen = ref(false)
const pendingUser = ref(true)
const profileMenuRef = ref<HTMLElement | null>(null)

// 1. Ambil fetchUser dari composable
const { user, fetchUser, logout } = useAuth()

// 2. Jalankan fetchUser saat komponen dimuat (jika state user masih kosong)
onMounted(async () => {
  pendingUser.value = true
  try {
    if (!user.value) {
      await fetchUser()
    }
  } finally {
    pendingUser.value = false
  }

  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 3. Pengecekan field nama yang lebih fleksibel
const fullName = computed(() => {
  if (!user.value) return 'Pengguna'
  return user.value.name || user.value.nama || user.value.full_name || user.value.username || 'Pengguna'
})

// 4. Pengecekan field email
const email = computed(() => {
  if (!user.value) return '-'
  return user.value.email || user.value.username || '-'
})

const firstName = computed(() => fullName.value.split(' ')[0])

const initials = computed(() => {
  return fullName.value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('')
})

const currentYear = new Date().getFullYear()

async function handleLogout() {
  isProfileOpen.value = false
  await logout()
}

function handleClickOutside(e: MouseEvent) {
  if (profileMenuRef.value && !profileMenuRef.value.contains(e.target as Node)) {
    isProfileOpen.value = false
  }
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>