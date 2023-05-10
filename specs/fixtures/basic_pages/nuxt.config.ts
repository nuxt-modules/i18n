import CustomModule from './module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [CustomModule, '@nuxtjs/i18n'],

  i18n: {
    lazy: false,
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        file: 'en-US.json'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        file: 'fr-FR.json'
      }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: false
  }
})
