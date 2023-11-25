export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'fr',
    differentDomains: true,
    locales: [
      {
        code: 'en',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'fr',
        domain: 'fr.nuxt-app.localhost'
      },
      {
        code: 'nl',
        domain: 'localhost'
      }
    ],
    strategy: 'no_prefix'
    // detectBrowserLanguage: false
  },
  ssr: false
})
