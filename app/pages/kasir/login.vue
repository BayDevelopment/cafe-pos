<!-- app/pages/kasir/login.vue -->
<template>
    <div class="stage min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

        <!-- Ambient glow -->
        <div class="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"></div>
        <div class="absolute -bottom-32 -right-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"></div>

        <div class="flex-1 flex items-center justify-center w-full">
            <div class="ticket-wrap relative z-10 w-full max-w-md">

                <!-- Spike hole -->
                <div class="spike-hole" aria-hidden="true"></div>

                <div class="ticket">

                    <!-- Header -->
                    <div class="px-8 pt-8 pb-6 text-center">
                        <div
                            class="inline-flex items-center gap-1.5 mono label-xs px-3 py-1.5 rounded-full bg-[#2b1b12] text-[#faf6ee] mb-4">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect x="3" y="7" width="18" height="13" rx="1.5" stroke="currentColor"
                                    stroke-width="2" />
                                <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="2" />
                            </svg>
                            Terminal Kasir
                        </div>

                        <div class="flex items-center justify-center gap-2.5 mb-2">
                            <svg width="26" height="26" viewBox="0 0 34 34" fill="none" aria-hidden="true">
                                <path d="M6 13h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-7Z" stroke="#B8763C"
                                    stroke-width="1.6" />
                                <path d="M24 15h2.5a3.5 3.5 0 0 1 0 7H24" stroke="#B8763C" stroke-width="1.6" />
                                <path d="M4 27h22" stroke="#B8763C" stroke-width="1.6" stroke-linecap="round" />
                            </svg>
                            <h1 class="display text-2xl font-bold tracking-tight text-[#2b1b12]">KEDAI KOPI</h1>
                        </div>
                        <p class="mono text-xs text-[#8A7A68]">Masuk menggunakan kredensial kasir Anda</p>
                    </div>

                    <!-- Perforation -->
                    <div class="perforation" role="presentation">
                        <span class="notch notch-left"></span>
                        <span class="notch notch-right"></span>
                    </div>

                    <!-- Body -->
                    <div class="px-8 pt-6 pb-8">

                        <div v-if="errorMessage" role="alert" aria-live="assertive" class="stamp mb-5">
                            <span>DITOLAK — {{ errorMessage }}</span>
                        </div>

                        <form @submit.prevent="handleLogin" class="space-y-5" novalidate>
                            <div>
                                <label for="email" class="mono label-xs block text-[#8A7A68] mb-1.5">Email Kasir</label>
                                <input id="email" v-model="form.email" type="email" required autocomplete="username"
                                    placeholder="kasir@kedaikopi.com" class="field" />
                            </div>

                            <div>
                                <label for="password" class="mono label-xs block text-[#8A7A68] mb-1.5">Kata
                                    Sandi</label>
                                <input id="password" v-model="form.password" type="password" required
                                    autocomplete="current-password" placeholder="••••••••" class="field" />
                            </div>

                            <button type="submit" :disabled="isLoading" class="btn-stamp mono mt-2">
                                <span v-if="isLoading" class="dot-spin" aria-hidden="true"></span>
                                {{ isLoading ? 'MEMVERIFIKASI…' : 'MASUK KE KASIR' }}
                            </button>
                        </form>

                        <div class="text-center pt-6 mt-6 border-t border-[#2b1b12]/10">
                            <NuxtLink to="/"
                                class="mono text-[0.7rem] text-[#8A7A68] hover:text-[#b8763c] transition-colors">
                                ← Kembali ke Menu Utama (Guest)
                            </NuxtLink>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="relative z-10 py-5 text-center">
            <p class="mono label-xs text-[#8A7A68]/70">Developed by Bayu Albar Ladici</p>
        </footer>

    </div>
</template>

<script setup>
useHead({
    link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
    ]
})

const form = ref({ email: '', password: '' })
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()

const handleLogin = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
        const res = await $fetch('/api/auth/login', {
            method: 'POST',
            body: form.value
        })

        if (res.success) {
            // Validasi ketat: pastikan role adalah KASIR
            if (res.role !== 'KASIR') {
                errorMessage.value = 'Akses ditolak, akun ini bukan hak akses kasir.'
                return
            }
            router.push('/kasir/dashboard')
        }
    } catch (error) {
        errorMessage.value = error.data?.message || 'Email atau kata sandi salah!'
    } finally {
        isLoading.value = false
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
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.stage {
    background-color: #1c1410;
    background-image: radial-gradient(circle at 1px 1px, rgba(250, 246, 238, 0.05) 1px, transparent 0);
    background-size: 22px 22px;
}

.glow {
    background: radial-gradient(circle, rgba(184, 118, 60, 0.16) 0%, transparent 70%);
    filter: blur(10px);
}

.ticket-wrap {
    filter: drop-shadow(0 25px 45px rgba(0, 0, 0, 0.55));
}

.spike-hole {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: #1c1410;
    border: 1.5px solid #b8763c;
    box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.6);
    z-index: 20;
}

.ticket {
    background: #faf6ee;
    border-radius: 6px;
    position: relative;
    overflow: hidden;
}

.perforation {
    position: relative;
    height: 0;
    border-top: 1.5px dashed rgba(43, 27, 18, 0.22);
}

.notch {
    position: absolute;
    top: -9px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #1c1410;
}

.notch-left {
    left: -9px;
}

.notch-right {
    right: -9px;
}

.field {
    width: 100%;
    background: #f4eee3;
    border: 1.5px solid rgba(43, 27, 18, 0.15);
    border-radius: 6px;
    padding: 0.7rem 0.85rem;
    font-size: 0.85rem;
    font-family: 'IBM Plex Mono', monospace;
    color: #2b1b12;
    transition: border-color 0.15s ease;
}

.field::placeholder {
    color: #b3a693;
}

.field:focus {
    outline: none;
    border-color: #b8763c;
}

.field:focus-visible {
    outline: 2px solid #b8763c;
    outline-offset: 2px;
}

.stamp {
    border: 1.5px solid #9b3a2e;
    color: #9b3a2e;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.55rem 0.75rem;
    border-radius: 3px;
    transform: rotate(-1deg);
    text-align: center;
    background: rgba(155, 58, 46, 0.06);
}

.btn-stamp {
    width: 100%;
    background: #2b1b12;
    color: #faf6ee;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 0.85rem 1rem;
    border-radius: 4px;
    border: 1.5px solid #2b1b12;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: transform 0.12s ease, background 0.15s ease, opacity 0.15s ease;
}

.btn-stamp:hover:not(:disabled) {
    background: #b8763c;
    border-color: #b8763c;
    transform: rotate(-0.6deg) scale(1.01);
}

.btn-stamp:focus-visible {
    outline: 2px solid #b8763c;
    outline-offset: 3px;
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

@media (prefers-reduced-motion: reduce) {

    .dot-spin,
    .btn-stamp {
        animation: none !important;
        transition: none !important;
    }
}
</style>