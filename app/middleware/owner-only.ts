// middleware/owner-only.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Ambil data user yang sedang login
  const { data: user } = await useFetch('/api/auth/me')
  
  const role = user.value?.role?.toUpperCase()

  // Jika bukan PEMILIK, tolak dan arahkan kembali ke dashboard kasir
  if (role !== 'PEMILIK') {
    return navigateTo('/kasir/dashboard')
  }
})