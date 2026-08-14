<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-8 font-sans">
    
    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#faf6ee] text-[#1c1410]">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="mono label-xs px-2.5 py-1 rounded-xl bg-[#1c1410] text-[#faf6ee] font-semibold">AKUN SAYA</span>
          <span class="mono label-xs text-[#1c1410]/60">PROFIL & KEAMANAN</span>
        </div>
        <h1 class="display text-2xl md:text-3xl text-[#1c1410] font-bold tracking-tight">
          Informasi Profil Pengguna
        </h1>
        <p class="mono text-xs text-[#1c1410]/70 mt-1">
          Kelola informasi identitas akun, peran akses, serta status verifikasi email Anda.
        </p>
      </div>
    </header>

    <!-- NOTIFIKASI TOAST -->
    <div
      v-if="notification.show"
      class="fixed top-5 right-5 z-50 px-6 py-3.5 rounded-xl border shadow-lg transition-all mono text-xs font-semibold"
      :class="notification.type === 'success' ? 'bg-[#faf6ee] border-emerald-600/30 text-emerald-900 shadow-emerald-900/10' : 'bg-[#faf6ee] border-rose-600/30 text-rose-700 shadow-rose-900/10'"
    >
      {{ notification.message }}
    </div>

    <!-- KONTROL UTAMA (KARTU PROFIL) -->
    <section class="ticket-card p-6 sm:p-8 space-y-6 bg-[#faf6ee]">
      
      <!-- IDENTITAS UTAMA (AVATAR & NAMA) -->
      <div class="pb-6 border-b border-[#1c1410]/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="w-20 h-20 rounded-xl bg-[#c9793f]/10 text-[#c9793f] flex items-center justify-center font-bold text-2xl display border border-[#c9793f]/20 flex-shrink-0">
          {{ userInitials }}
        </div>
        <div class="space-y-1 w-full">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 class="display text-xl text-[#1c1410] font-bold">{{ user.name }}</h2>
            <span class="mono label-xs px-3 py-1 rounded-xl bg-[#c9793f]/10 text-[#c9793f] font-bold w-fit border border-[#c9793f]/20">
              {{ user.role }}
            </span>
          </div>
          <p class="mono text-xs text-[#1c1410]/60">Bergabung sejak {{ formatDate(user.createdAt) }}</p>
        </div>
      </div>

      <!-- DETAIL INFORMASI AKUN -->
      <div class="space-y-5 mono text-xs">
        <!-- Nama Lengkap -->
        <div class="space-y-1.5">
          <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Nama Lengkap</label>
          <input
            v-model="user.name"
            type="text"
            placeholder="Nama Anda"
            class="w-full px-4 py-3 rounded-xl bg-white/60 text-[#1c1410] font-semibold border border-[#1c1410]/15 focus:outline-none focus:border-[#c9793f] transition-all"
          />
        </div>

        <!-- Email & Status Verifikasi -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Alamat Email</label>
            
            <!-- Status Badge & Tombol Verifikasi -->
            <div class="flex items-center gap-2">
              <span v-if="user.emailVerifiedAt" class="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 text-[0.65rem] font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                TERVERIFIKASI
              </span>
              <button
                v-else
                type="button"
                @click="sendVerificationEmail"
                :disabled="isSendingVerification"
                class="text-xs text-[#c9793f] hover:underline font-bold bg-[#c9793f]/10 px-2.5 py-1 rounded-lg border border-[#c9793f]/20 transition-all disabled:opacity-50"
              >
                {{ isSendingVerification ? "MENGIRIM..." : "VERIFIKASI SEKARANG" }}
              </button>
            </div>
          </div>

          <input
            v-model="user.email"
            type="email"
            disabled
            class="w-full px-4 py-3 rounded-xl bg-[#1c1410]/5 text-[#1c1410]/60 font-semibold border border-[#1c1410]/10 cursor-not-allowed"
          />
          <p v-if="!user.emailVerifiedAt" class="text-[0.65rem] text-rose-600 font-medium">
            * Email Anda belum diverifikasi. Silakan klik tombol verifikasi di atas untuk mengamankan akun.
          </p>
        </div>

        <!-- Status Akun Aktif -->
        <div class="space-y-1.5">
          <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Status Akun</label>
          <div class="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/60 border border-[#1c1410]/15">
            <span class="w-2 h-2 rounded-full" :class="user.isActive ? 'bg-emerald-600' : 'bg-rose-600'"></span>
            <span class="font-semibold text-[#1c1410]">{{ user.isActive ? 'Aktif (Dapat Mengakses Sistem)' : 'Dinonaktifkan' }}</span>
          </div>
        </div>
      </div>

      <!-- ACTION BUTTON -->
      <div class="pt-6 border-t border-[#1c1410]/10 flex justify-end">
        <button
          type="button"
          @click="updateProfile"
          :disabled="loading"
          class="btn-stamp mono px-6 py-3 text-xs flex items-center justify-center gap-2"
        >
          <span v-if="loading">MENYIMPAN...</span>
          <span v-else>SIMPAN PERUBAHAN PROFIL</span>
        </button>
      </div>

    </section>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ['auth']
})

const loading = ref(false)
const isSendingVerification = ref(false)
const notification = ref({ show: false, message: '', type: 'success' })

// Reactive state untuk data user sesuai skema
const user = reactive({
  name: '',
  email: '',
  role: 'KASIR',
  isActive: true,
  emailVerifiedAt: null,
  createdAt: new Date()
})

// Fetch data profil pengguna dari backend
const { data: response, refresh } = await useFetch('/api/auth/me', {
  credentials: 'include'
})

watchEffect(() => {
  if (response.value?.data) {
    const data = response.value.data
    user.name = data.name || ''
    user.email = data.email || ''
    user.role = data.role || 'KASIR'
    user.isActive = data.isActive ?? true
    user.emailVerifiedAt = data.emailVerifiedAt || null
    user.createdAt = data.createdAt || new Date()
  }
})

// Inisial nama untuk avatar
const userInitials = computed(() => {
  if (!user.name) return 'U'
  return user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

// Fungsi Kirim Token Verifikasi Email
async function sendVerificationEmail() {
  try {
    isSendingVerification.value = true
    const res = await $fetch('/api/auth/send-verification', {
      method: 'POST',
      credentials: 'include'
    })
    if (res.success) {
      showNotification('Link verifikasi telah dikirim ke email Anda. Silakan cek inbox/spam.', 'success')
    }
  } catch (error) {
    const msg = error?.data?.message || error?.data?.statusMessage || 'Gagal mengirim email verifikasi.'
    showNotification(msg, 'error')
  } finally {
    isSendingVerification.value = false
  }
}

// Fungsi Simpan Perubahan Profil
async function updateProfile() {
  if (!user.name.trim()) {
    showNotification('Nama lengkap tidak boleh kosong.', 'error')
    return
  }

  try {
    loading.value = true
    const res = await $fetch('/api/auth/profile', {
      method: 'PUT',
      body: { name: user.name.trim() },
      credentials: 'include'
    })

    if (res.success) {
      showNotification('Profil berhasil diperbarui!', 'success')
      refresh()
    }
  } catch (error) {
    const msg = error?.data?.message || error?.data?.statusMessage || 'Gagal memperbarui profil.'
    showNotification(msg, 'error')
  } finally {
    loading.value = false
  }
}

function showNotification(message, type) {
  notification.value = { show: true, message, type }
  setTimeout(() => { notification.value.show = false }, 3500)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(dateString))
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

.btn-stamp {
  background: #1c1410;
  color: #f8f5ee;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  border-radius: 0.75rem;
  border: 1px solid #1c1410;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: #c9793f;
  border-color: #c9793f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(201, 121, 63, 0.25);
}

.btn-stamp:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-stamp:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>