export default defineNuxtConfig({
  // devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],

  i18n: {
    restructureDir: false,
    locales: ['en', 'ja'],
    detectBrowserLanguage: false
  }
})
