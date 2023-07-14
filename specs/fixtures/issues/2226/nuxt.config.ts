export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['en', 'de'],
    defaultLocale: 'en',
    strategy: 'prefix_and_default'
  }
})
