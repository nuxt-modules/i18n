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
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'no',
        iso: 'no-NO',
        name: 'Norwegian',
        domain: 'no.nuxt-app.localhost'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français',
        domain: 'fr.nuxt-app.localhost'
      }
    ],
    defaultLocale: 'ja'
  }
})
