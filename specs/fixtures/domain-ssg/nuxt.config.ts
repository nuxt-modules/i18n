// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    differentDomains: true,
    // the test servers listen on `127.0.0.1`, `localhost` domains would never match and always resolve the catchall locale
    locales: [
      { code: 'en', language: 'en-US', name: 'English', domain: '127.0.0.1:7786', file: 'en.json', isCatchallLocale: true },
      { code: 'es', language: 'es-ES', name: 'Español', domain: '127.0.0.1:7787', file: 'es.json' }
    ],
    baseUrl: 'http://localhost:3333',
    detectBrowserLanguage: false
  },

  compatibilityDate: '2025-03-30'
})
