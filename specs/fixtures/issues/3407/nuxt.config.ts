// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    // some of the options are taken from the runtimeConfig
    strategy: 'no_prefix',
    differentDomains: true,
    lazy: false,
    locales: [
      {
        code: 'en',
        language: 'en-US',
        isCatchallLocale: true,
        domain: '127.0.0.1:7776',
        // domain: 'en.localhost',
        name: 'English',
        files: ['en.json']
      },
      {
        code: 'es',
        language: 'es-ES',
        domain: '127.0.0.1:7777',
        // domain: 'es.localhost',
        name: 'Español',
        files: ['es.json']
      }
    ],
    detectBrowserLanguage: false
  }
})
