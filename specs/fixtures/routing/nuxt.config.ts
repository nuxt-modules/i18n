export default defineNuxtConfig({
  // devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],

  i18n: {
    baseUrl: 'http://localhost:3000',
    restructureDir: false,
    locales: ['en', 'ja'],
    detectBrowserLanguage: false
  }
})
