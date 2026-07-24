export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  experimental: {
    typedPages: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    strategy: 'prefix_except_default',
    experimental: {
      typedPages: true,
    },
  },
})
