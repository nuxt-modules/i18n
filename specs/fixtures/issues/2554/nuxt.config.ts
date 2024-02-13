export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['en', 'fr'],
    strategy: 'no_prefix'
  }
})
