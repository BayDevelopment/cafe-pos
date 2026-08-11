// app/composables/useAuth.ts
export const useAuth = () => {
    const user = useState<any>('auth_user', () => null)

    const fetchUser = async () => {
        try {
            // Sertakan header cookie agar dibaca dengan benar oleh SSR & Nitro
            const headers = useRequestHeaders(['cookie']) as Record<string, string>
            const res: any = await $fetch('/api/auth/me', { headers })
            
            // Fleksibel: Ekstrak data user baik berupa res.user, res.data, maupun res langsung
            const userData = res?.user || res?.data || res

            // Pastikan data yang didapat merupakan objek user yang valid
            if (userData && typeof userData === 'object' && !Array.isArray(userData)) {
                user.value = userData
                return userData
            }
        } catch (err) {
            user.value = null
        }
        return null
    }

    const setUser = (userData: any) => {
        user.value = userData
    }

    // Fungsi baru untuk memperbarui data user secara parsial (misal: ganti nama doang)
    const updateUser = (newData: Record<string, any>) => {
        if (user.value) {
            user.value = { ...user.value, ...newData }
        } else {
            user.value = newData
        }
    }

    const logout = async () => {
        try {
            // 1. Panggil API logout agar backend juga menghapus session/cookie (HttpOnly)
            await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
        } finally {
            // 2. Hapus cookie di browser (untuk cookie non-HttpOnly) & reset state
            const tokenCookie = useCookie('auth_token')
            tokenCookie.value = null
            user.value = null

            // 3. Pindah ke halaman login
            await navigateTo('/kasir/login')
        }
    }

    return {
        user,
        setUser,
        updateUser,
        fetchUser,
        logout
    }
}