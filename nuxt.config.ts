export default defineNuxtConfig({
  css: ['~~/assets/css/main.css'],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/supabase",
    "nuxt-lucide-icons",
  ],
  supabase: {
    redirect: false,
  },
});