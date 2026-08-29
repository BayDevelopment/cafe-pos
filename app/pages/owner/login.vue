<!-- app/pages/owner/login.vue -->
<template>
  <div
    class="stage min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
  >
    <!-- Ambient glow -->
    <div
      class="absolute -top-32 -left-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"
    ></div>
    <div
      class="absolute -bottom-32 -right-24 w-[26rem] h-[26rem] rounded-full pointer-events-none glow"
    ></div>

    <div class="flex-1 flex items-center justify-center w-full">
      <div class="ticket-wrap relative z-10 w-full max-w-md">
        <!-- Spike hole -->
        <div class="spike-hole" aria-hidden="true"></div>

        <div class="ticket">
          <!-- Header -->
          <div class="px-8 pt-8 pb-6 text-center">
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
              Owner Portal · Akses Terbatas
            </div>

            <div class="flex items-center justify-center gap-2.5 mb-2">
              <svg
                width="26"
                height="26"
                viewBox="0 0 34 34"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 13h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-7Z"
                  stroke="#B8763C"
                  stroke-width="1.6"
                />
                <path
                  d="M24 15h2.5a3.5 3.5 0 0 1 0 7H24"
                  stroke="#B8763C"
                  stroke-width="1.6"
                />
                <path
                  d="M4 27h22"
                  stroke="#B8763C"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
              <h1
                class="display text-2xl font-bold tracking-tight text-[#2b1b12]"
              >
                KEDAI KOPI
              </h1>
            </div>
            <p class="mono text-xs text-[#8A7A68]">
              Masukkan kredensial pemilik untuk otorisasi penuh
            </p>
          </div>

          <!-- Perforation -->
          <div class="perforation" role="presentation">
            <span class="notch notch-left"></span>
            <span class="notch notch-right"></span>
          </div>

          <!-- Body -->
          <div class="px-8 pt-6 pb-8">
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
              <span>DITOLAK — {{ errorMessage }}</span>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-5" novalidate>
              <div>
                <label
                  for="email"
                  class="mono label-xs block text-[#8A7A68] mb-1.5"
                  >Email Owner</label
                >
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  autocomplete="username"
                  placeholder="owner@kedaikopi.com"
                  class="field"
                />
              </div>

              <div>
                <label
                  for="password"
                  class="mono label-xs block text-[#8A7A68] mb-1.5"
                  >Kata Sandi</label
                >
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  required
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="field"
                />
                <div class="text-right mt-1.5">
                  <NuxtLink
                    to="/auth/forgot-password"
                    class="mono text-[0.7rem] text-[#8A7A68] hover:text-[#b8763c] transition-colors"
                  >
                    Lupa kata sandi?
                  </NuxtLink>
                </div>
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
                {{
                  successMessage
                    ? "MENGALIHKAN…"
                    : isLoading
                      ? "MEMVERIFIKASI…"
                      : "MASUK KE DASHBOARD"
                }}
              </button>
            </form>

            <div class="text-center pt-6 mt-6 border-t border-[#2b1b12]/10">
              <NuxtLink
                to="/"
                class="mono text-[0.7rem] text-[#8A7A68] hover:text-[#b8763c] transition-colors"
              >
                ← Kembali ke Menu Utama (Guest)
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="relative z-10 py-5 text-center">
      <p class="mono label-xs text-[#8A7A68]/70">
        Developed by Bayu Albar Ladici
      </p>
    </footer>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ["auth"],
  layout: false,
});

useHead({
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    },
  ],
});

// Pastikan useAuth benar-benar tersedia, jika tidak ada, beri fallback kosong agar tidak error JS
const { setUser, fetchUser } = useAuth
  ? useAuth()
  : { setUser: null, fetchUser: null };

const form = ref({ email: "", password: "" });
const isLoading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    console.log("[DEBUG] 1. Mengirim request ke /api/auth/login...");

    const res = await $fetch("/api/auth/login", {
      method: "POST",
      body: form.value,
    });

    console.log("[DEBUG] 2. Response dari server diterima:", res);

    if (res?.success) {
      const rawRole = res.role || res.user?.role || res.data?.role || "";
      const userRole = String(rawRole).toUpperCase();

      console.log("[DEBUG] 3. Role terdeteksi:", userRole);

      if (userRole !== "PEMILIK" && userRole !== "OWNER") {
        errorMessage.value = `Akses ditolak, akun ini ber-role "${rawRole}".`;
        isLoading.value = false;
        return;
      }

      console.log("[DEBUG] 4. Role aman, memperbarui state auth...");
      try {
        if (typeof setUser === "function" && (res.user || res.data)) {
          setUser(res.user || res.data);
        } else if (typeof fetchUser === "function") {
          await fetchUser();
        }
      } catch (authError) {
        console.warn(
          "[DEBUG] Gagal update state auth (Abaikan jika redirect jalan):",
          authError,
        );
      }

      console.log(
        "[DEBUG] 5. Menampilkan pesan sukses, lalu mengalihkan ke Dashboard...",
      );
      successMessage.value = "Login berhasil, mengalihkan ke dashboard...";

      setTimeout(() => {
        window.location.href = "/owner/dashboard";
      }, 900);
    } else {
      console.warn(
        "[DEBUG] Server membalas 200 OK, tapi tidak ada status success: true",
        res,
      );
      errorMessage.value = "Format respon dari server tidak valid.";
      isLoading.value = false;
    }
  } catch (error) {
    console.error("[DEBUG] 6. Error tertangkap (Crash/Ditolak):", error);
    // Tangkap pesan error dari server Nitro (error.data.message) atau error bawaan (error.message)
    errorMessage.value =
      error.data?.message || error.message || "Server gagal merespon!";
    isLoading.value = false;
  }
};
</script>