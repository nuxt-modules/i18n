export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: ['en', 'ja'],
    detectBrowserLanguage: false,
    vueI18n: './config/i18n.config.ts'
  }
})
