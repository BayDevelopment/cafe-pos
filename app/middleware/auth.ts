// app/middleware/auth.ts
export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, fetchUser } = useAuth();

  // 1. PASTIKAN TUNGGU SAMPAI SELESAI: 
  // Jika state user masih kosong, paksa tunggu fetchUser() selesai dulu sebelum lanjut ke bawah!
  if (!user.value) {
    try {
      await fetchUser();
    } catch (e) {
      // Jika gagal fetch (misal session habis/token invalid)
      // abaikan error agar bisa ditangani di blok cek user di bawah
    }
  }

  // 2. JIKA USER TETAP BELUM LOGIN SETELAH FETCH
  if (!user.value) {
    if (to.path !== '/kasir/login' && to.path !== '/owner/login') {
      if (to.path.startsWith('/owner')) {
        return navigateTo('/owner/login');
      }
      return navigateTo('/kasir/login');
    }
    return; // Izinkan akses halaman login bagi guest
  }

  // 3. JIKA USER SUDAH LOGIN (Data sudah pasti ada, tidak akan null lagi)
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

  // B. Pengecualian untuk halaman bersama (seperti profil)
  if (to.path.includes('/profile')) {
    return;
  }

  // C. Batasi akses antar role secara akurat
  if (to.path.startsWith('/owner') && role !== 'PEMILIK') {
    return navigateTo('/kasir/dashboard');
  }

  if (to.path.startsWith('/kasir') && role !== 'KASIR' && role !== 'PEMILIK') {
    return navigateTo('/owner/dashboard');
  }
});