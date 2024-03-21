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
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    // TODO: remove this later, apply in test `setup`
    // `false` will not be overwritten by `runtimeConfig` making this fixture less reusable
    detectBrowserLanguage: false,
    vueI18n: './config/i18n.config.ts'
  }
})
