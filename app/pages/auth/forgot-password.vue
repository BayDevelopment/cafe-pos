<!-- app/pages/auth/forgot-password.vue -->
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
              Portal · Reset Password
            </div>
            <h1
              class="display text-2xl font-bold tracking-tight text-[#2b1b12] mb-2"
            >
              Lupa Kata Sandi
            </h1>
            <p class="mono text-xs text-[#8A7A68]">
              Masukkan email untuk menerima link reset password
            </p>
          </div>

          <div class="perforation" role="presentation">
            <span class="notch notch-left"></span>
            <span class="notch notch-right"></span>
          </div>

          <div class="px-8 pt-6 pb-8">
            <!-- Sengaja hanya SATU state hasil (bukan sukses/gagal terpisah) —
                 pesan dari server memang generik untuk semua kondisi, jadi
                 frontend juga tidak perlu (dan tidak boleh) membedakan
                 tampilan sukses vs gagal berdasarkan apakah email terdaftar. -->
            <div
              v-if="submitted"
              role="status"
              aria-live="polite"
              class="stamp-success mb-5"
            >
              <span>{{ resultMessage }}</span>
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
              v-if="!submitted"
              @submit.prevent="handleSubmit"
              class="space-y-5"
              novalidate
            >
              <div>
                <label
                  for="email"
                  class="mono label-xs block text-[#8A7A68] mb-1.5"
                  >Email</label
                >
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="username"
                  placeholder="emailanda@gmail.com"
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
                {{ isLoading ? "MENGIRIM…" : "KIRIM LINK RESET" }}
              </button>
            </form>

            <div class="text-center pt-6 mt-6 border-t border-[#2b1b12]/10">
              <NuxtLink
                to="/"
                class="mono text-[0.7rem] text-[#8A7A68] hover:text-[#b8763c] transition-colors"
              >
                ← Beranda
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
definePageMeta({
  layout: false,
  middleware: ["auth"],
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

const email = ref("");
const isLoading = ref(false);
const submitted = ref(false);
const errorMessage = ref("");
const resultMessage = ref("");

const handleSubmit = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const res = await $fetch("/api/auth/forgot-password", {
      method: "POST",
      body: { email: email.value },
    });

    // Tampilkan persis pesan generik dari server — jangan diubah/dipersempit
    // di frontend, supaya tidak membocorkan info soal email yang terdaftar.
    resultMessage.value =
      res?.message ||
      "Jika email tersebut terdaftar, kami telah mengirimkan link untuk mengatur ulang password.";
    submitted.value = true;
  } catch (error) {
    // Untuk error validasi (400, format email salah, rate limit 429), boleh
    // ditampilkan apa adanya — ini bukan soal "email ada/tidak", tapi soal
    // input yang memang tidak valid atau terlalu banyak percobaan.
    errorMessage.value =
      error.data?.message ||
      error.data?.statusMessage ||
      "Gagal mengirim permintaan, coba lagi.";
  } finally {
    isLoading.value = false;
  }
};
</script>
