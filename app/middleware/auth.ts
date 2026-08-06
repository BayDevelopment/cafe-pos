// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser } = useAuth();

  // 1. Ambil data user dari API jika state frontend masih kosong
  if (!user.value) {
    await fetchUser();
  }

  // 2. JIKA USER BELUM LOGIN
  if (!user.value) {
    // Jika mengakses selain halaman login, kembalikan ke login
    if (to.path !== '/kasir/login' && to.path !== '/owner/login') {
      if (to.path.startsWith('/owner')) {
        return navigateTo('/owner/login');
      }
      return navigateTo('/kasir/login');
    }
    return; // Izinkan akses halaman login bagi guest
  }

  // 3. JIKA USER SUDAH LOGIN
  const role = String(user.value?.role || '').toUpperCase().trim();

  // A. Jika user SUDAH LOGIN tapi mencoba membuka halaman LOGIN
  if (to.path === '/kasir/login' || to.path === '/owner/login') {
    if (role === 'KASIR') {
      return navigateTo('/kasir/dashboard');
    }
    if (role === 'PEMILIK') {
      return navigateTo('/owner/dashboard');
    }
  }

  // B. Batasi akses antar role
  if (to.path.startsWith('/owner') && role !== 'PEMILIK') {
    return navigateTo('/kasir/dashboard');
  }

  if (to.path.startsWith('/kasir') && role !== 'KASIR') {
    return navigateTo('/owner/dashboard');
  }
});