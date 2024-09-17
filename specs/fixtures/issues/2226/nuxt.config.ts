export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    locales: ['en', 'de'],
    defaultLocale: 'en',
    strategy: 'prefix_and_default'
  }
})
