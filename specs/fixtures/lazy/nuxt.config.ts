import i18nModule from './i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [i18nModule, '@nuxtjs/i18n'],
  i18n: {
    // langDir: 'lang',
    // defaultLocale: 'fr',
    detectBrowserLanguage: false,
    compilation: {
      strictMessage: false
    },
    defaultLocale: 'en',
    langDir: 'lang',
    lazy: true,
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'lazy-locale-en.json',
        name: 'English'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        files: ['lazy-locale-en.json', 'lazy-locale-en-GB.js', 'lazy-locale-en-GB.ts'],
        name: 'English (UK)'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: { path: 'lazy-locale-fr.json5', cache: false },
        name: 'Français'
      }
    ]
  },
  site: {
    url: 'http://localhost:3000'
  }
})
