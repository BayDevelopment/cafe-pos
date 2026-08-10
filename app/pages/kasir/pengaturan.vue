<!-- app/pages/kasir/pengaturan.vue -->
<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto space-y-8 font-sans">

    <!-- HEADER HALAMAN -->
    <header class="ticket-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="mono label-xs px-2 py-0.5 rounded bg-[#2b1b12] text-[#faf6ee]">SISTEM</span>
          <span class="mono label-xs text-[#8A7A68]">KONFIGURASI</span>
        </div>
        <h1 class="display text-2xl text-[#2b1b12] font-bold">Pengaturan Toko & Pajak</h1>
        <p class="mono text-xs text-[#8A7A68] mt-0.5">Kelola profil kafe, pesan pada struk, dan persentase pajak.</p>
      </div>

      <button 
        type="button"
        :disabled="isSaving"
        class="btn-stamp mono px-4 py-2.5 text-xs"
        @click="saveSettings"
      >
        <span v-if="isSaving" class="dot-spin" aria-hidden="true"></span>
        {{ isSaving ? 'MENYIMPAN…' : '💾 SIMPAN PERUBAHAN' }}
      </button>
    </header>

    <!-- NOTIFIKASI SUKSES / ERROR -->
    <div v-if="statusMessage.text" class="ticket-card p-4 text-xs mono" :class="statusMessage.isError ? 'text-[#9b3a2e] bg-red-50' : 'text-emerald-800 bg-emerald-50'">
      {{ statusMessage.text }}
    </div>

    <!-- FORM PENGATURAN -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- LEFT COLUMN: PREVIEW STRUK RINGKAS -->
      <div class="md:col-span-1 space-y-4">
        <div class="ticket-card p-5 space-y-3 text-center border-dashed border-2 border-[#2b1b12]/20">
          <p class="mono label-xs text-[#8A7A68]">Preview Header Struk</p>
          <div class="border-t border-b border-dashed border-[#2b1b12]/20 py-3 space-y-1">
            <h2 class="display font-bold text-lg text-[#2b1b12]">{{ form.storeName || 'NAMA KAFE' }}</h2>
            <p class="mono text-[0.7rem] text-[#8A7A68] leading-tight">{{ form.storeAddress || 'Alamat Kafe...' }}</p>
            <p class="mono text-[0.7rem] text-[#8A7A68]">Telp: {{ form.storePhone || '-' }}</p>
          </div>
          <div class="pt-2">
            <p class="mono text-[0.68rem] italic text-[#8A7A68] font-serif">"{{ form.receiptFooter || 'Pesan footer...' }}"</p>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: FORM INPUT -->
      <div class="md:col-span-2 space-y-6">

        <!-- KELOMPOK 1: INFORMASI TOKO -->
        <section class="ticket-card p-6 space-y-4">
          <h2 class="display text-base text-[#2b1b12] font-bold border-b border-[#2b1b12]/10 pb-2">
            📍 Profil Toko & Struk
          </h2>

          <div class="space-y-4">
            <div>
              <label for="store-name" class="mono label-xs block text-[#8A7A68] mb-1">Nama Kafe / Kedai</label>
              <input 
                id="store-name"
                v-model.trim="form.storeName" 
                type="text" 
                placeholder="Contoh: Kopi Janji Jiwa"
                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]" 
              />
            </div>

            <div>
              <label for="store-address" class="mono label-xs block text-[#8A7A68] mb-1">Alamat Lengkap</label>
              <textarea 
                id="store-address"
                v-model.trim="form.storeAddress" 
                rows="2" 
                placeholder="Contoh: Jl. Sudirman No. 45, Jakarta Selatan"
                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full resize-none focus:outline-none focus:border-[#b8763c]"
              ></textarea>
            </div>

            <div>
              <label for="store-phone" class="mono label-xs block text-[#8A7A68] mb-1">Nomor Telepon / WhatsApp</label>
              <input 
                id="store-phone"
                v-model.trim="form.storePhone" 
                type="text" 
                placeholder="Contoh: 0812-3456-7890"
                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]" 
              />
            </div>

            <div>
              <label for="receipt-footer" class="mono label-xs block text-[#8A7A68] mb-1">Pesan Footer Struk</label>
              <input 
                id="receipt-footer"
                v-model.trim="form.receiptFooter" 
                type="text" 
                placeholder="Contoh: Wi-Fi: kopi12345 | Terima kasih!"
                class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c]" 
              />
            </div>
          </div>
        </section>

        <!-- KELOMPOK 2: PAJAK & BIAYA LAYANAN -->
        <section class="ticket-card p-6 space-y-4">
          <h2 class="display text-base text-[#2b1b12] font-bold border-b border-[#2b1b12]/10 pb-2">
            🏷️ Pajak & Biaya Layanan
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label for="tax-rate" class="mono label-xs block text-[#8A7A68] mb-1">Pajak Restoran / PB1 (%)</label>
              <div class="relative flex items-center">
                <input 
                  id="tax-rate"
                  v-model.number="form.taxPercent" 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="10"
                  class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] pr-8" 
                />
                <span class="absolute right-3 mono text-xs text-[#8A7A68]">%</span>
              </div>
              <p class="mono text-[0.68rem] text-[#8A7A68] mt-1">Isi 0 jika tidak dikenakan pajak.</p>
            </div>

            <div>
              <label for="service-rate" class="mono label-xs block text-[#8A7A68] mb-1">Biaya Layanan / Service (%)</label>
              <div class="relative flex items-center">
                <input 
                  id="service-rate"
                  v-model.number="form.servicePercent" 
                  type="number" 
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  class="field mono text-sm p-2.5 bg-[#f4eee3] rounded border border-[#2b1b12]/20 w-full focus:outline-none focus:border-[#b8763c] pr-8" 
                />
                <span class="absolute right-3 mono text-xs text-[#8A7A68]">%</span>
              </div>
              <p class="mono text-[0.68rem] text-[#8A7A68] mt-1">Biaya tambahan layanan kafe.</p>
            </div>
          </div>
        </section>

      </div>

    </div>

  </div>
</template>

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

const isSaving = ref(false)
const statusMessage = reactive({ text: '', isError: false })

// Form State
const form = reactive({
  storeName: 'Rumah Kopi Nuansa',
  storeAddress: 'Jl. Pemuda No. 123, Bandung',
  storePhone: '0812-9988-7766',
  receiptFooter: 'Wi-Fi: rumahkopi2026 | Terima Kasih!',
  taxPercent: 10,
  servicePercent: 0,
})

// Load Data Pengaturan Saat Halaman Dimuat
const { data: response } = await useFetch('/api/settings')
if (response.value?.data) {
  Object.assign(form, response.value.data)
}

// Simpan Pengaturan
async function saveSettings() {
  isSaving.value = true
  statusMessage.text = ''
  statusMessage.isError = false

  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: form
    })
    
    statusMessage.text = 'Pengaturan berhasil diperbarui!'
  } catch (error) {
    statusMessage.isError = true
    statusMessage.text = 'Gagal menyimpan pengaturan: ' + (error.data?.message || error.message)
  } finally {
    isSaving.value = false
  }
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
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  padding: 0.85rem 1rem;
  border-radius: 4px;
  border: 1.5px solid #2b1b12;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
  background: #b8763c;
  border-color: #b8763c;
  transform: rotate(-0.6deg) scale(1.01);
}

.btn-stamp:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dot-spin {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(250, 246, 238, 0.35);
  border-top-color: #faf6ee;
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>