import CustomModule from './module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [CustomModule, '@nuxtjs/i18n'],

  i18n: {
    lazy: false,
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'ja',
        iso: 'ja',
        name: 'Japanese'
      },
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        domain: 'project-en.example.com'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
        // domain: 'project-fr.example.com'
      },
      {
        code: 'nl',
        iso: 'nl-NL',
        // file: 'nl.json',
        domain: undefined,
        name: 'Nederlands'
      }
    ],
    defaultLocale: 'ja',
    detectBrowserLanguage: false
  }
})
