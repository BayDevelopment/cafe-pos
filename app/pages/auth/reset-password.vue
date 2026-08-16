<!-- app/pages/owner/reset-password.vue -->
<template>
  <div
    class="stage min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
  >
    <div
      class="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"
    ></div>
    <div
      class="absolute -bottom-32 -right-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"
    ></div>

    <div class="flex-1 flex items-center justify-center w-full">
      <div class="ticket-wrap relative z-10 w-full max-w-md">
        <div class="spike-hole" aria-hidden="true"></div>

        <div class="ticket">
          <div class="px-6 sm:px-8 pt-8 pb-6 text-center">
            <div
              class="inline-flex items-center gap-1.5 mono label-xs px-3 py-1.5 rounded-full bg-[#9b3a2e] text-[#faf6ee] mb-4"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
              Owner Portal · Atur Ulang
            </div>
            <h1
              class="display text-2xl font-bold tracking-tight text-[#2b1b12] mb-2"
            >
              Atur Ulang Password
            </h1>
            <p class="mono text-xs text-[#8A7A68]">
              Masukkan password baru untuk akun kamu
            </p>
          </div>

          <div class="perforation" role="presentation">
            <span class="notch notch-left"></span>
            <span class="notch notch-right"></span>
          </div>

          <div class="px-6 sm:px-8 pt-6 pb-8">
            <!-- Token tidak ada di URL sama sekali -->
            <div v-if="!hasToken" role="alert" class="stamp mb-5">
              <span
                >Link reset password tidak valid. Silakan minta link baru.</span
              >
            </div>

            <template v-else>
              <div
                v-if="successMessage"
                role="status"
                aria-live="polite"
                class="stamp-success mb-5"
              >
                <span>{{ successMessage }}</span>
              </div>

              <div
                v-if="errorMessage"
                role="alert"
                aria-live="assertive"
                class="stamp mb-5"
              >
                <span>{{ errorMessage }}</span>
              </div>

              <form
                v-if="!successMessage"
                @submit.prevent="handleSubmit"
                class="space-y-5"
                novalidate
              >
                <div>
                  <label
                    for="newPassword"
                    class="mono label-xs block text-[#8A7A68] mb-1.5"
                    >Password Baru</label
                  >
                  <input
                    id="newPassword"
                    v-model="form.newPassword"
                    type="password"
                    required
                    autocomplete="new-password"
                    placeholder="Minimal 8 karakter"
                    class="field"
                  />
                </div>

                <div>
                  <label
                    for="confirmPassword"
                    class="mono label-xs block text-[#8A7A68] mb-1.5"
                    >Konfirmasi Password</label
                  >
                  <input
                    id="confirmPassword"
                    v-model="form.confirmPassword"
                    type="password"
                    required
                    autocomplete="new-password"
                    placeholder="Ulangi password baru"
                    class="field"
                  />
                </div>

                <button
                  type="submit"
                  :disabled="isLoading"
                  class="btn-stamp mono mt-2"
                >
                  <span
                    v-if="isLoading"
                    class="dot-spin"
                    aria-hidden="true"
                  ></span>
                  {{ isLoading ? "MEMPROSES…" : "SIMPAN PASSWORD BARU" }}
                </button>
              </form>
            </template>

            <div class="text-center pt-6 mt-6 border-t border-[#2b1b12]/10">
              <NuxtLink
                to="/owner/login"
                class="mono text-[0.7rem] text-[#8A7A68] hover:text-[#b8763c] transition-colors"
              >
                ← Kembali ke Login
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <footer class="relative z-10 py-5 text-center">
      <p class="mono label-xs text-[#8A7A68]/70">
        Developed by Bayu Albar Ladici
      </p>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({ layout: false });

useHead({
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    },
  ],
});

const route = useRoute();
// Token diambil dari query string (?token=...), TIDAK pernah ditampilkan
// balik ke UI dan tidak disimpan di form.value yang bisa berubah — dipakai
// langsung apa adanya saat submit.
const token = typeof route.query.token === "string" ? route.query.token : "";
const hasToken = computed(() => !!token);

const form = ref({ newPassword: "", confirmPassword: "" });
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const handleSubmit = async () => {
  if (isLoading.value) return;
  errorMessage.value = "";

  if (form.value.newPassword.length < 8) {
    errorMessage.value = "Password baru minimal 8 karakter.";
    return;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    errorMessage.value = "Konfirmasi password tidak cocok.";
    return;
  }

  isLoading.value = true;
  try {
    const res = await $fetch("/api/auth/reset-password", {
      method: "POST",
      body: {
        token,
        newPassword: form.value.newPassword,
        confirmPassword: form.value.confirmPassword,
      },
    });

    successMessage.value =
      res?.message ||
      "Password berhasil direset. Silakan login dengan password baru.";
    form.value.newPassword = "";
    form.value.confirmPassword = "";

    // Redirect ke halaman login sesuai role akun yang barusan direset.
    const loginPath = res?.role === "PEMILIK" ? "/owner/login" : "/kasir/login";
    setTimeout(() => {
      navigateTo(loginPath, { replace: true });
    }, 2000);
  } catch (error) {
    errorMessage.value =
      error.data?.statusMessage ||
      error.data?.message ||
      "Gagal mereset password, link mungkin sudah kedaluwarsa.";
  } finally {
    isLoading.value = false;
  }
};
</script>
