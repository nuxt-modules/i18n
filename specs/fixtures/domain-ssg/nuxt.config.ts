// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    differentDomains: true,
    locales: [
      { code: 'en', language: 'en-US', name: 'English', domain: 'localhost:7786', isCatchallLocale: true },
      { code: 'es', language: 'es-ES', name: 'Español', domain: 'localhost:7787' }
    ],
    baseUrl: 'http://localhost:3333',
    detectBrowserLanguage: false
  },

  compatibilityDate: '2025-03-30'
})
