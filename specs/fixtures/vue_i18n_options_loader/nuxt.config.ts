// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  vite: {
    build: {
      minify: false
    }
  },

  i18n: {
    lazy: true,
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: false
  }
})
