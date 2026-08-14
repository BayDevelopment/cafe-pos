<script setup>
definePageMeta({
  middleware: ['owner-only']
})

useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
  ]
})

const loading = ref(false)
const notification = ref({ show: false, message: '', type: 'success' })
const fileInput = ref(null)
const logoPreview = ref(null)
const logoFile = ref(null)

const LIMITS = {
  shopName: 255,
  address: 500,
  phone: 20,
  maxImageSize: 1 * 1024 * 1024, // 1 MB
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}
const PHONE_REGEX = /^[0-9+()\-\s]{6,20}$/

const shop = reactive({
  shop_name: '',
  address: '',
  phone: '',
  logo_url: ''
})

const { data: response, refresh } = await useFetch('/api/settings', {
  credentials: 'include'
})

watchEffect(() => {
  if (response.value?.data) {
    const data = response.value.data
    shop.shop_name = data.shop_name || ''
    shop.address = data.address || ''
    shop.phone = data.phone || ''
    shop.logo_url = data.logo_url || ''

    if (data.logo_url && !logoPreview.value) {
      logoPreview.value = data.logo_url
    }
  }
})

function onLogoSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.size > LIMITS.maxImageSize) {
    showNotification('Ukuran logo terlalu besar. Maksimal 1 MB.', 'error')
    event.target.value = ''
    return
  }
  if (!LIMITS.allowedImageTypes.includes(file.type)) {
    showNotification('Format gambar tidak didukung. Gunakan JPG, PNG, atau WEBP.', 'error')
    event.target.value = ''
    return
  }

  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

function validateForm() {
  const name = shop.shop_name.trim()

  if (!name) {
    showNotification('Nama toko wajib diisi.', 'error')
    return false
  }
  if (name.length > LIMITS.shopName) {
    showNotification(`Nama toko tidak boleh melebihi ${LIMITS.shopName} karakter.`, 'error')
    return false
  }
  if (shop.address && shop.address.length > LIMITS.address) {
    showNotification(`Alamat tidak boleh melebihi ${LIMITS.address} karakter.`, 'error')
    return false
  }
  if (shop.phone) {
    if (shop.phone.length > LIMITS.phone) {
      showNotification(`Nomor telepon tidak boleh melebihi ${LIMITS.phone} karakter.`, 'error')
      return false
    }
    if (!PHONE_REGEX.test(shop.phone)) {
      showNotification('Format nomor telepon tidak valid.', 'error')
      return false
    }
  }
  return true
}

async function saveSettings() {
  if (!validateForm()) return

  loading.value = true

  const formData = new FormData()
  formData.append('shop_name', shop.shop_name.trim())
  formData.append('address', shop.address.trim())
  formData.append('phone', shop.phone.trim())

  if (logoFile.value) {
    formData.append('logo', logoFile.value)
  }

  try {
    const res = await $fetch('/api/settings', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    if (res.success) {
      showNotification('Identitas toko & struk berhasil diperbarui!', 'success')
      logoFile.value = null
      if (fileInput.value) fileInput.value.value = ''
      refresh()
    }
  } catch (error) {
    const msg = error?.data?.message || error?.data?.statusMessage || 'Gagal menyimpan pengaturan.'
    showNotification(msg, 'error')
  } finally {
    loading.value = false
  }
}

function showNotification(message, type) {
  notification.value = { show: true, message, type }
  setTimeout(() => { notification.value.show = false }, 3500)
}
</script>

<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto space-y-6 md:space-y-8 font-sans">
    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#faf6ee] text-[#1c1410]">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="mono label-xs px-2.5 py-1 rounded-xl bg-[#1c1410] text-[#faf6ee] font-semibold">PENGATURAN</span>
          <span class="mono label-xs text-[#1c1410]/60">SISTEM & BRANDING</span>
        </div>
        <h1 class="display text-2xl md:text-3xl text-[#1c1410] font-bold tracking-tight">
          Pengaturan Toko & Struk
        </h1>
        <p class="mono text-xs text-[#1c1410]/70 mt-1">
          Logo & Nama Toko tampil di Login, seluruh informasi di bawah otomatis tercetak pada Struk Kasir.
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

    <!-- KONTROL UTAMA (FORM CARD) -->
    <section class="ticket-card p-6 sm:p-8 space-y-6 bg-[#faf6ee]">
      
      <!-- BAGIAN LOGO TOKO -->
      <div class="pb-6 border-b border-[#1c1410]/10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div class="w-24 h-24 rounded-xl bg-[#1c1410]/5 border-2 border-dashed border-[#1c1410]/20 flex items-center justify-center overflow-hidden relative shadow-inner flex-shrink-0">
          <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
          <span v-else class="mono text-[0.65rem] text-[#1c1410]/60 text-center p-2 font-medium">Belum ada logo</span>
        </div>
        <div class="space-y-2">
          <h2 class="display text-base text-[#1c1410] font-bold">Logo Toko / Bisnis</h2>
          <p class="mono text-xs text-[#1c1410]/60">Digunakan untuk Branding Login & Header Struk Thermal. Maks. 1 MB (JPG/PNG/WEBP).</p>
          <div>
            <button
              type="button"
              @click="fileInput?.click()"
              class="btn-stamp mono px-4 py-2.5 text-xs inline-flex items-center gap-2"
            >
              Unggah Logo Baru
            </button>
            <input type="file" ref="fileInput" class="hidden" accept="image/png,image/jpeg,image/webp" @change="onLogoSelected" />
          </div>
        </div>
      </div>

      <!-- FORM PENGATURAN INFORMASI -->
      <div class="space-y-5 mono text-xs">
        <div class="space-y-1.5">
          <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Nama Toko (Login & Header Struk)</label>
          <input
            v-model="shop.shop_name"
            type="text"
            :maxlength="LIMITS.shopName"
            placeholder="Contoh: Kopi Senja Utama"
            class="w-full px-4 py-3 rounded-xl bg-white/60 text-[#1c1410] font-semibold border border-[#1c1410]/15 focus:outline-none focus:border-[#c9793f] transition-all"
          />
        </div>

        <div class="space-y-1.5">
          <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Alamat Lengkap (Header Struk)</label>
          <textarea
            v-model="shop.address"
            rows="3"
            :maxlength="LIMITS.address"
            placeholder="Contoh: Jl. Raya Pandeglang No. 45, Banten"
            class="w-full px-4 py-3 rounded-xl bg-white/60 text-[#1c1410] font-semibold border border-[#1c1410]/15 focus:outline-none focus:border-[#c9793f] transition-all resize-none"
          ></textarea>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[#1c1410]/70 font-semibold uppercase tracking-wider text-[0.7rem]">Nomor Telepon / WhatsApp (Header Struk)</label>
          <input
            v-model="shop.phone"
            type="text"
            :maxlength="LIMITS.phone"
            placeholder="Contoh: 081234567890"
            class="w-full px-4 py-3 rounded-xl bg-white/60 text-[#1c1410] font-semibold border border-[#1c1410]/15 focus:outline-none focus:border-[#c9793f] transition-all"
          />
        </div>
      </div>

      <!-- ACTION BUTTON -->
      <div class="pt-6 border-t border-[#1c1410]/10 flex justify-end">
        <button
          type="button"
          @click="saveSettings"
          :disabled="loading"
          class="btn-stamp mono px-6 py-3 text-xs flex items-center justify-center gap-2"
        >
          <span v-if="loading">MENYIMPAN PERUBAHAN...</span>
          <span v-else>SIMPAN PENGATURAN TOKO</span>
        </button>
      </div>

    </section>
  </div>
</template>

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