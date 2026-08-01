// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['../common'],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'http://localhost:3000',
    locales: [
      { code: 'en', language: 'en', name: 'English' },
      { code: 'nl', language: 'nl-NL', name: 'Nederlands' },
      { code: 'fr', language: 'fr-FR', name: 'Français' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true
    }
  }
})
