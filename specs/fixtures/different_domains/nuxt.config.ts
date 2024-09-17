import CustomModule from './module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [CustomModule, '@nuxtjs/i18n'],

  i18n: {
    restructureDir: false,
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
