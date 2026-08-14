<template>
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans bg-[#f3ede2]">
        <div class="w-full max-w-md">

            <!-- KARTU UTAMA -->
            <div class="ticket-card p-6 md:p-8 bg-[#faf6ee] text-[#1c1410] relative overflow-hidden">
                <div
                    class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#c9793f]/10 pointer-events-none blur-2xl">
                </div>

                <!-- HEADER -->
                <div class="mb-6 relative z-10">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="mono label-xs text-[#c9793f] font-bold tracking-widest">PEMULIHAN AKUN</span>
                    </div>
                    <h1 class="display text-2xl md:text-3xl text-[#1c1410] tracking-tight font-bold">
                        Atur Ulang Password
                    </h1>
                    <p class="mono text-xs text-[#1c1410]/70 mt-1">
                        Masukkan password baru untuk akun Anda.
                    </p>
                </div>

                <!-- TOKEN TIDAK ADA DI URL -->
                <div v-if="!token" class="relative z-10 space-y-4">
                    <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 text-xs mono">
                        Link reset password tidak valid. Pastikan Anda membuka link langsung dari email yang dikirimkan.
                    </div>
                    <NuxtLink to="/auth/lupa-password"
                        class="btn-stamp w-full mono inline-flex items-center justify-center">
                        MINTA LINK BARU
                    </NuxtLink>
                </div>

                <!-- ALERT ERROR -->
                <div v-else-if="errorMessage && !isSubmitted"
                    class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-800 mb-6 text-xs mono relative z-10">
                    {{ errorMessage }}
                </div>

                <!-- PESAN SUKSES -->
                <div v-if="isSubmitted" class="relative z-10 space-y-4">
                    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs mono space-y-2">
                        <div class="flex items-center gap-2 font-bold">
                            <LucideCheckCircle2 class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>Password Berhasil Diubah!</span>
                        </div>
                        <p class="text-[0.7rem] text-emerald-800/80 leading-relaxed">
                            Silakan login menggunakan password baru Anda.
                        </p>
                    </div>
                    <div class="flex flex-col gap-2">
                        <NuxtLink to="/kasir/login" class="btn-stamp w-full mono inline-flex items-center justify-center">
                            LOGIN SEBAGAI KASIR
                        </NuxtLink>
                        <NuxtLink to="/owner/login"
                            class="mono text-xs text-center text-[#1c1410]/70 hover:text-[#c9793f] transition-colors py-2">
                            atau login sebagai Pemilik
                        </NuxtLink>
                    </div>
                </div>

                <!-- FORM INPUT -->
                <form v-else-if="token" @submit.prevent="handleResetPassword" class="space-y-5 relative z-10">
                    <div class="space-y-1.5">
                        <label class="mono label-xs text-[#1c1410]/70 block">PASSWORD BARU</label>
                        <div class="relative">
                            <span
                                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1c1410]/40">
                                <LucideLock class="w-4 h-4" />
                            </span>
                            <input v-model="form.newPassword" :type="showPassword ? 'text' : 'password'" required
                                minlength="8" maxlength="200" placeholder="Minimal 8 karakter"
                                class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/50 text-[#1c1410] mono text-xs focus:outline-none focus:border-[#c9793f] focus:ring-1 focus:ring-[#c9793f] transition-all" />
                            <button type="button" @click="showPassword = !showPassword"
                                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1c1410]/40 hover:text-[#1c1410]/70">
                                <LucideEye v-if="!showPassword" class="w-4 h-4" />
                                <LucideEyeOff v-else class="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label class="mono label-xs text-[#1c1410]/70 block">KONFIRMASI PASSWORD BARU</label>
                        <div class="relative">
                            <span
                                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1c1410]/40">
                                <LucideLock class="w-4 h-4" />
                            </span>
                            <input v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" required
                                minlength="8" maxlength="200" placeholder="Ulangi password baru"
                                class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/50 text-[#1c1410] mono text-xs focus:outline-none focus:border-[#c9793f] focus:ring-1 focus:ring-[#c9793f] transition-all" />
                        </div>
                        <p v-if="form.confirmPassword && form.newPassword !== form.confirmPassword"
                            class="mono text-[0.65rem] text-red-600 pl-1">
                            Konfirmasi password tidak cocok.
                        </p>
                    </div>

                    <!-- TOMBOL SUBMIT -->
                    <button type="submit" :disabled="pending || !isFormValid"
                        class="btn-stamp w-full mono group inline-flex items-center justify-center cursor-pointer">
                        <span v-if="pending" class="flex items-center gap-2">
                            <LucideLoader2 class="w-4 h-4 animate-spin" />
                            <span>MEMPROSES...</span>
                        </span>
                        <span v-else class="flex items-center gap-2">
                            <span>SIMPAN PASSWORD BARU</span>
                            <LucideArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </form>

                <!-- FOOTER / KEMBALI KE LOGIN -->
                <div v-if="!isSubmitted" class="mt-6 pt-5 border-t border-[#1c1410]/10 text-center relative z-10">
                    <NuxtLink to="/kasir/login"
                        class="mono text-xs text-[#1c1410]/70 hover:text-[#c9793f] transition-colors inline-flex items-center gap-1.5">
                        <LucideArrowLeft class="w-3.5 h-3.5" />
                        <span>Kembali ke halaman login</span>
                    </NuxtLink>
                </div>

            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({
    layout: 'default',
    middleware: ['guest']
})

const route = useRoute()
// Token datang dari link email: /auth/reset-password?token=xxx
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')

const form = reactive({
    newPassword: '',
    confirmPassword: '',
})

const pending = ref(false)
const isSubmitted = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const isFormValid = computed(() => {
    return form.newPassword.length >= 8
        && form.newPassword.length <= 200
        && form.newPassword === form.confirmPassword
})

const handleResetPassword = async () => {
    if (!isFormValid.value) return

    pending.value = true
    errorMessage.value = ''

    try {
        await $fetch('/api/auth/reset-password', {
            method: 'POST',
            body: {
                token: token.value,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
            },
        })
        isSubmitted.value = true
    } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status
        const serverMsg = error?.data?.statusMessage || error?.data?.message

        if (statusCode === 429) {
            errorMessage.value = serverMsg || 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa saat.'
        } else if (statusCode === 400) {
            errorMessage.value = serverMsg || 'Link reset password tidak valid atau sudah kedaluwarsa.'
        } else {
            errorMessage.value = 'Terjadi kesalahan. Silakan coba lagi nanti.'
        }
        console.error('Gagal reset password', error)
    } finally {
        pending.value = false
    }
}

useHead({
    title: 'Atur Ulang Password - Portal Eksekutif',
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
    ]
})
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
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid #1c1410;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    text-decoration: none;
}

.btn-stamp:hover:not(:disabled) {
    background: #c9793f;
    border-color: #c9793f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(201, 121, 63, 0.25);
}

.btn-stamp:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>