export default defineNuxtRouteMiddleware(async () => {
  const { user, fetchUser } = useAuth();

  if (!user.value) {
    try {
      await fetchUser();
    } catch (e) {
      // Belum login / token invalid — itu memang kondisi yang diharapkan di sini, lanjut saja.
    }
  }

  if (user.value) {
    const role = String(user.value?.role || "").toUpperCase().trim();

    if (role === "PEMILIK") {
      return navigateTo("/owner/dashboard");
    }
    if (role === "KASIR") {
      return navigateTo("/kasir/dashboard");
    }
  }

  // Belum login — biarkan akses halaman ini seperti biasa.
});