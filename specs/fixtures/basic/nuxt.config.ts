import CustomModule from './module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // devtools: { enabled: false },
  modules: [CustomModule, '@nuxtjs/i18n'],

  srcDir: '.',
  i18n: {
    restructureDir: false,
    lazy: false,
    baseUrl: 'http://localhost:3000',
    // strategy: 'prefix',
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    // TODO: remove this later, set to `{}` in test `setup` and overwrite using `startServerWithRuntimeConfig`
    // `false` will not be overwritten by `runtimeConfig` making this fixture less reusable
    detectBrowserLanguage: false,
    vueI18n: './config/i18n.config.ts'
  }
})
