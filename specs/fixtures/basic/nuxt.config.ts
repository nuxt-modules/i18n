import CustomModule from './module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
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
    // TODO: remove this later, set to `{}` in test `setup` and overwrite using `startServerWithRuntimeConfig`
    // `false` will not be overwritten by `runtimeConfig` making this fixture less reusable
    detectBrowserLanguage: false,
    vueI18n: './config/i18n.config.ts'
  }
})
