<template>
    <div class="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans relative">

        <!-- TOAST ALERT NOTIFICATION (CUSTOM) -->
        <Transition name="slide-fade">
            <div v-if="showAlert"
                class="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs mono max-w-sm"
                :class="alertType === 'success' ? 'bg-[#1c1410] text-[#faf6ee] border-[#c9793f]' : 'bg-[#9b3a2e] text-[#faf6ee] border-[#7a2e24]'">
                <span class="text-base leading-none">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
                <p class="font-medium">{{ alertMessage }}</p>
            </div>
        </Transition>

        <!-- HEADER / KARTU PROFIL UTAMA -->

        <!-- SKELETON HEADER -->
        <div v-if="pending && !user" class="ticket-card p-6 md:p-8 relative overflow-hidden bg-[#faf6ee]">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="flex items-center gap-5 w-full">
                    <div class="skeleton w-16 h-16 md:w-20 md:h-20 rounded-2xl flex-shrink-0"></div>
                    <div class="space-y-2 flex-1">
                        <div class="skeleton h-4 w-24 rounded"></div>
                        <div class="skeleton h-7 w-48 rounded"></div>
                        <div class="skeleton h-3 w-36 rounded"></div>
                    </div>
                </div>
                <div class="skeleton h-10 w-32 rounded-xl flex-shrink-0"></div>
            </div>
        </div>

        <!-- HEADER ASLI -->
        <div v-else class="ticket-card p-6 md:p-8 relative overflow-hidden bg-[#faf6ee] text-[#1c1410]">
            <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#c9793f]/10 pointer-events-none blur-2xl">
            </div>

            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        <img :src="avatarUrl" alt="Avatar"
                            class="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#1c1410] border-2 border-[#1c1410]/10 shadow-sm" />
                        <span class="absolute -bottom-1 -right-1 block h-4 w-4 rounded-full ring-2 ring-[#faf6ee]"
                            :class="user?.isActive ? 'bg-emerald-500' : 'bg-rose-500'"
                            :title="user?.isActive ? 'Aktif' : 'Nonaktif'" />
                    </div>

                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="mono label-xs px-2 py-0.5 rounded-md bg-[#c9793f]/10 text-[#c9793f] font-bold">
                                {{ user?.role || 'KASIR' }}
                            </span>
                            <span v-if="pending"
                                class="mono text-[10px] text-[#c9793f] flex items-center gap-1.5 animate-pulse font-semibold">
                                <LucideLoader2 class="w-3 h-3 animate-spin" /> Memuat...
                            </span>
                        </div>
                        <h1 class="display text-2xl md:text-3xl text-[#1c1410] tracking-tight font-bold">
                            {{ user?.name || 'Memuat Profil...' }}
                        </h1>
                        <p class="mono text-xs text-[#1c1410]/70 mt-0.5">
                            {{ user?.email || 'email@kedaikopi.com' }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3 w-full md:w-auto">
                    <button @click="handleLogout"
                        class="btn-stamp-outline mono inline-flex items-center gap-2 no-underline flex-1 md:flex-initial justify-center">
                        <LucideLogOut class="w-4 h-4 text-rose-600" />
                        <span>KELUAR AKUN</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- GRID KONTROL PROFIL -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <!-- SKELETON GRID -->
            <template v-if="pending && !user">
                <div class="ticket-card p-6 md:p-8 bg-[#faf6ee] md:col-span-2 space-y-6">
                    <div class="space-y-2">
                        <div class="skeleton h-5 w-56 rounded"></div>
                        <div class="skeleton h-3 w-72 rounded"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div class="skeleton h-11 rounded-xl"></div>
                        <div class="skeleton h-11 rounded-xl"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1c1410]/10">
                        <div class="skeleton h-11 rounded-xl"></div>
                        <div class="skeleton h-11 rounded-xl"></div>
                        <div class="skeleton h-11 rounded-xl sm:col-span-2"></div>
                    </div>
                    <div class="flex justify-end">
                        <div class="skeleton h-10 w-40 rounded-xl"></div>
                    </div>
                </div>

                <div class="ticket-card p-6 md:p-8 bg-[#faf6ee] space-y-4 self-start">
                    <div class="skeleton h-5 w-40 rounded"></div>
                    <div class="skeleton h-20 rounded-xl"></div>
                    <div class="skeleton h-16 rounded-xl"></div>
                </div>
            </template>

            <!-- FORM EDIT PROFIL & PASSWORD (2 KOLOM) -->
            <template v-else>
                <div class="ticket-card p-6 md:p-8 bg-[#faf6ee] md:col-span-2 space-y-6">
                    <div>
                        <h3 class="display text-lg text-[#1c1410] font-bold flex items-center gap-2">
                            <LucideUserCheck class="w-5 h-5 text-[#c9793f]" />
                            <span>Pengaturan & Keamanan Akun</span>
                        </h3>
                        <p class="mono text-xs text-[#1c1410]/60 mt-1">Perbarui informasi identitas diri dan kata sandi
                            akun Anda.</p>
                    </div>

                    <form @submit.prevent="updateProfile" class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="mono label-xs text-[#1c1410]/70 block">NAMA LENGKAP</label>
                                <input v-model="form.name" type="text" required
                                    class="w-full px-4 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/60 text-sm mono focus:outline-none focus:border-[#c9793f] transition-colors"
                                    placeholder="Nama lengkap..." />
                            </div>

                            <div class="space-y-1.5">
                                <div class="flex justify-between items-center">
                                    <label class="mono label-xs text-[#1c1410]/70 block">ALAMAT EMAIL</label>
                                    <span v-if="isEmailDisabled"
                                        class="text-[10px] text-amber-700 mono font-semibold">Terkunci (Sudah
                                        Terverifikasi)</span>
                                    <span v-else class="text-[10px] text-emerald-700 mono font-semibold">Belum
                                        Verifikasi (Dapat Diubah)</span>
                                </div>
                                <input v-model="form.email" type="email" required :disabled="isEmailDisabled"
                                    :class="isEmailDisabled ? 'opacity-60 cursor-not-allowed bg-[#1c1410]/5' : 'bg-white/60'"
                                    class="w-full px-4 py-2.5 rounded-xl border border-[#1c1410]/15 text-sm mono focus:outline-none focus:border-[#c9793f] transition-colors"
                                    placeholder="email@domain.com" />
                            </div>
                        </div>

                        <!-- GANTI PASSWORD -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#1c1410]/10">
                            <div class="space-y-1.5 sm:col-span-2">
                                <label class="mono label-xs text-[#1c1410]/70 block">GANTI PASSWORD (Opsional)</label>
                                <p class="mono text-[10px] text-[#1c1410]/50 -mt-1 mb-1">Kosongkan semua kolom di bawah
                                    jika tidak ingin mengubah password.</p>
                            </div>

                            <div class="space-y-1.5">
                                <label class="mono label-xs text-[#1c1410]/70 block">PASSWORD LAMA</label>
                                <input v-model="form.oldPassword" type="password" autocomplete="current-password"
                                    class="w-full px-4 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/60 text-sm mono focus:outline-none focus:border-[#c9793f] transition-colors"
                                    placeholder="Wajib diisi jika ganti password..." />
                            </div>

                            <div class="space-y-1.5">
                                <label class="mono label-xs text-[#1c1410]/70 block">PASSWORD BARU</label>
                                <input v-model="form.newPassword" type="password" autocomplete="new-password"
                                    class="w-full px-4 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/60 text-sm mono focus:outline-none focus:border-[#c9793f] transition-colors"
                                    placeholder="Minimal 6 karakter..." />
                            </div>

                            <div class="space-y-1.5 sm:col-span-2">
                                <label class="mono label-xs text-[#1c1410]/70 block">KONFIRMASI PASSWORD BARU</label>
                                <input v-model="form.confirmPassword" type="password" autocomplete="new-password"
                                    class="w-full px-4 py-2.5 rounded-xl border border-[#1c1410]/15 bg-white/60 text-sm mono focus:outline-none focus:border-[#c9793f] transition-colors"
                                    placeholder="Ulangi password baru..." />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <label class="mono label-xs text-[#1c1410]/70 block">STATUS AKUN (isActive)</label>
                                <div
                                    class="px-4 py-2.5 rounded-xl border border-[#1c1410]/10 bg-white/40 text-sm mono font-semibold flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full"
                                        :class="user?.isActive ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                                    {{ user?.isActive ? 'Aktif' : 'Nonaktif' }}
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label class="mono label-xs text-[#1c1410]/70 block">AKUN DIBUAT PADA</label>
                                <div
                                    class="px-4 py-2.5 rounded-xl border border-[#1c1410]/10 bg-white/40 text-sm mono text-[#1c1410]/80">
                                    {{ formatDate(user?.createdAt) }}
                                </div>
                            </div>
                        </div>


                        <div class="pt-2 flex justify-end">
                            <button type="submit" :disabled="loadingUpdate"
                                class="btn-stamp mono inline-flex items-center gap-2">
                                <LucideLoader2 v-if="loadingUpdate" class="w-4 h-4 animate-spin" />
                                <LucideSave v-else class="w-4 h-4 text-current transition-colors duration-200" />
                                <span>{{ loadingUpdate ? 'MENGUBAH DATA...' : 'SIMPAN PERUBAHAN' }}</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- KARTU INFORMASI PERAN & STATUS (1 KOLOM) -->
                <!-- self-start: tinggi card ini mengikuti konten sendiri, tidak ikut stretch mengikuti card sebelah kiri -->
                <div class="ticket-card p-6 md:p-8 bg-[#faf6ee] space-y-6 self-start">
                    <div>
                        <h3 class="display text-lg text-[#1c1410] font-bold flex items-center gap-2 mb-4">
                            <LucideShieldCheck class="w-5 h-5 text-[#c9793f]" />
                            <span>Keamanan & Hak Akses</span>
                        </h3>

                        <div class="space-y-4">
                            <div class="p-4 rounded-xl border border-[#1c1410]/10 bg-white/40 space-y-1">
                                <span class="mono label-xs text-[#1c1410]/60">HAK AKSES SISTEM</span>
                                <p class="display text-base font-bold text-[#1c1410]">
                                    {{ user?.role === 'PEMILIK' ? 'Pemilik Toko' : 'Kasir / POS Operator'
                                    }}
                                </p>
                                <p class="mono text-[0.7rem] text-[#1c1410]/70 mt-1">
                                    {{ user?.role === 'PEMILIK' ? 'Memiliki hak istimewa mengubah email kapan saja meskipun sudah terverifikasi.' : 'Email terkunci otomatis jika sudah terverifikasi demi keamanan.' }}
                                </p>
                            </div>

                            <div class="p-4 rounded-xl border border-[#1c1410]/10 bg-white/40 space-y-2">
                                <span class="mono label-xs text-[#1c1410]/60">VERIFIKASI EMAIL</span>
                                <p class="mono text-xs font-semibold"
                                    :class="user?.emailVerifiedAt ? 'text-emerald-600' : 'text-amber-600'">
                                    {{ user?.emailVerifiedAt ? 'Terverifikasi' : 'Belum Diverifikasi' }}
                                </p>

                                <button v-if="!user?.emailVerifiedAt" @click="handleSendVerification"
                                    :disabled="sendingVerification || verificationSent"
                                    class="btn-verify mono inline-flex items-center gap-2 mt-1">
                                    <LucideLoader2 v-if="sendingVerification" class="w-3.5 h-3.5 animate-spin" />
                                    <LucideMailCheck v-else class="w-3.5 h-3.5" />
                                    <span>{{ verifyButtonLabel }}</span>
                                </button>

                                <p v-if="verificationError" class="mono text-[10px] text-rose-600 mt-1">
                                    {{ verificationError }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 rounded-2xl bg-[#c9793f]/5 border border-[#c9793f]/20">
                        <div class="flex items-start gap-3">
                            <LucideInfo class="w-5 h-5 text-[#c9793f] flex-shrink-0 mt-0.5" />
                            <p class="mono text-[0.7rem] text-[#1c1410]/70 leading-relaxed">
                                Pastikan menjaga kerahasiaan kata sandi akun Anda demi keamanan transaksi kedai.
                            </p>
                        </div>
                    </div>
                </div>
            </template>

        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

definePageMeta({
    middleware: ['auth']
})

// 1. Ambil state global & fungsi dari useAuth
const { user, fetchUser, updateUser, logout } = useAuth()

const pending = ref(true)
const loadingUpdate = ref(false)

// --- Toast Alert (custom, gantikan box success/error inline) ---
const alertMessage = ref('')
const alertType = ref<'success' | 'error'>('success')
const showAlert = ref(false)
let alertTimeout: ReturnType<typeof setTimeout> | null = null

function triggerAlert(msg: string, type: 'success' | 'error' = 'success') {
    if (alertTimeout) clearTimeout(alertTimeout)
    alertMessage.value = msg
    alertType.value = type
    showAlert.value = true
    alertTimeout = setTimeout(() => {
        showAlert.value = false
    }, 3000)
}

const sendingVerification = ref(false)
const verificationSent = ref(false)
const verificationError = ref('')

const verifyButtonLabel = computed(() => {
    if (sendingVerification.value) return 'MENGIRIM...'
    if (verificationSent.value) return 'EMAIL TERKIRIM'
    return 'VERIFIKASI EMAIL'
})

const form = reactive({
    name: '',
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// Logika Frontend: Email disable jika sudah terverifikasi DAN role BUKAN PEMILIK
const isEmailDisabled = computed(() => {
    const isVerified = !!user.value?.emailVerifiedAt
    const isOwner = user.value?.role?.toUpperCase() === 'PEMILIK'
    return isVerified && !isOwner
})

// Encode nama agar query string avatar tidak rusak jika ada spasi/simbol
const avatarUrl = computed(() => {
    const seed = encodeURIComponent(user.value?.name || 'user')
    return `https://api.dicebear.com/8.x/notionists-neutral/svg?seed=${seed}&backgroundColor=c9793f`
})

const fetchUserData = async () => {
    pending.value = true
    try {
        const res = await fetchUser()
        if (res) {
            form.name = res.name || ''
            form.email = res.email || ''
        }
    } catch (err: any) {
        console.error('Gagal memuat profil:', err)
    } finally {
        pending.value = false
    }
}

onMounted(async () => {
    if (!user.value) {
        await fetchUserData()
    } else {
        form.name = user.value.name || ''
        form.email = user.value.email || ''
        pending.value = false
    }
})

const resetPasswordFields = () => {
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
}

const updateProfile = async () => {
    if (loadingUpdate.value) return
    loadingUpdate.value = true

    const wantsPasswordChange = !!form.newPassword || !!form.oldPassword || !!form.confirmPassword

    if (wantsPasswordChange) {
        if (!form.oldPassword) {
            triggerAlert('Password lama wajib diisi untuk mengganti password.', 'error')
            loadingUpdate.value = false
            return
        }
        if (!form.newPassword || form.newPassword.length < 6) {
            triggerAlert('Password baru minimal harus 6 karakter.', 'error')
            loadingUpdate.value = false
            return
        }
        if (form.newPassword !== form.confirmPassword) {
            triggerAlert('Konfirmasi password baru tidak cocok.', 'error')
            loadingUpdate.value = false
            return
        }
    }

    try {
        const payload: any = {
            name: form.name,
            email: form.email
        }

        if (wantsPasswordChange) {
            payload.oldPassword = form.oldPassword
            payload.newPassword = form.newPassword
        }

        const res: any = await $fetch('/api/auth/update-profile', {
            method: 'PUT',
            body: payload
        })

        if (res?.success) {
            triggerAlert('Profil dan keamanan berhasil diperbarui!', 'success')
            
            // 👉 UPDATE STATE GLOBAL SECARA INSTAN AGAR NAVBAR LANGSUNG BERUBAH
            updateUser({ name: form.name, email: form.email })

            resetPasswordFields()
            await fetchUserData()
        }
    } catch (err: any) {
        triggerAlert(err?.data?.message || err.message || 'Gagal memperbarui profil.', 'error')
    } finally {
        loadingUpdate.value = false
    }
}

const handleSendVerification = async () => {
    if (sendingVerification.value || verificationSent.value) return

    verificationError.value = ''
    sendingVerification.value = true

    try {
        await $fetch('/api/auth/send-verification', { method: 'POST' })
        verificationSent.value = true
    } catch (err: any) {
        verificationError.value = err?.data?.message || err.message || 'Gagal mengirim email verifikasi.'
    } finally {
        sendingVerification.value = false
    }
}

const handleLogout = async () => {
    try {
        await logout()
    } catch (err) {
        console.error('Logout error:', err)
        navigateTo('/kasir/login', { replace: true })
    }
}

const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date(dateString))
}

useHead({
    title: 'Profil Pengguna - Kedai Kopi POS',
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
}

.btn-stamp:hover {
    background: #c9793f;
    border-color: #c9793f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(201, 121, 63, 0.25);
}

.btn-stamp-outline {
    background: transparent;
    color: #1c1410;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    padding: 0.75rem 1.25rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(28, 20, 16, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.btn-stamp-outline:hover {
    background: rgba(225, 29, 72, 0.05);
    border-color: rgba(225, 29, 72, 0.3);
    color: #e11d48;
}

.btn-verify {
    background: transparent;
    color: #c9793f;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 0.5rem 0.85rem;
    border-radius: 0.6rem;
    border: 1px solid rgba(201, 121, 63, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-verify:hover:not(:disabled) {
    background: rgba(201, 121, 63, 0.1);
    border-color: #c9793f;
}

.btn-verify:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* SKELETON LOADING */
.skeleton {
    background: linear-gradient(90deg, #efe6d8 25%, #e0d2ba 50%, #efe6d8 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

/* TOAST TRANSITION */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
</style>