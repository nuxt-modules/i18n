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
      }
    ],
    strategy: 'prefix'
    // detectBrowserLanguage: false
  },
  ssr: false
})
