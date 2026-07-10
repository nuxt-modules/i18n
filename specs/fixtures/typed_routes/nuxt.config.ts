export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  experimental: {
    typedPages: true,
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'nl'],
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },
})
