<script setup>
const route = useRoute()
const router = useRouter()

const status = ref('loading') // 'loading' | 'success' | 'error'
const message = ref('')
const role = ref(null)

const token = route.query.token

async function verify() {
    if (!token) {
        status.value = 'error'
        message.value = 'Token verifikasi tidak ditemukan pada tautan ini.'
        return
    }

    try {
        const res = await $fetch('/api/auth/verifikasi-email', {
            query: { token },
            credentials: 'include',
        })

        role.value = res.role
        status.value = res.success ? 'success' : 'error'
        message.value = res.message
    } catch (err) {
        status.value = 'error'
        message.value = err?.data?.statusMessage || err?.data?.message || 'Terjadi kesalahan saat memverifikasi email.'
    }
}

function goToProfile() {
    // ⚠️ Sesuaikan prefix di sini kalau route PEMILIK kamu ternyata "/pemilik/..." bukan "/owner/..."
    const target = role.value === 'PEMILIK' ? '/owner/profile' : '/kasir/profile'
    router.push(target)
}

onMounted(() => {
    verify()
})

watch(status, (val) => {
    if (val === 'success' || val === 'error') {
        setTimeout(goToProfile, 3000)
    }
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-[#faf6ee] p-6">
        <div class="ticket-card max-w-md w-full p-8 text-center space-y-4 bg-white">

            <template v-if="status === 'loading'">
                <LucideLoader2 class="w-10 h-10 mx-auto animate-spin text-[#c9793f]" />
                <h1 class="display text-xl font-bold text-[#1c1410]">Memverifikasi Email...</h1>
                <p class="mono text-xs text-[#1c1410]/60">Mohon tunggu sebentar.</p>
            </template>

            <template v-else-if="status === 'success'">
                <LucideCheckCircle2 class="w-12 h-12 mx-auto text-emerald-600" />
                <h1 class="display text-xl font-bold text-[#1c1410]">Verifikasi Berhasil</h1>
                <p class="mono text-xs text-[#1c1410]/70">{{ message }}</p>
                <p class="mono text-[10px] text-[#1c1410]/40">Anda akan diarahkan ke halaman profil...</p>
            </template>

            <template v-else>
                <LucideXCircle class="w-12 h-12 mx-auto text-rose-600" />
                <h1 class="display text-xl font-bold text-[#1c1410]">Verifikasi Gagal</h1>
                <p class="mono text-xs text-[#1c1410]/70">{{ message }}</p>
                <p class="mono text-[10px] text-[#1c1410]/40">Anda akan diarahkan ke halaman profil...</p>
            </template>

            <button @click="goToProfile" class="btn-stamp mono px-6 py-3 text-xs mt-2">
                Kembali ke Profil Sekarang
            </button>

        </div>
    </div>
</template>

<style scoped>
.ticket-card {
    background: #faf6ee;
    border-radius: 1rem;
    border: 1px solid rgba(28, 20, 16, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

.btn-stamp {
    background: #1c1410;
    color: #f8f5ee;
    font-weight: 600;
    letter-spacing: 0.14em;
    border-radius: 0.75rem;
    border: 1px solid #1c1410;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-stamp:hover {
    background: #c9793f;
    border-color: #c9793f;
}
</style>