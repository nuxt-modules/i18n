// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    restructureDir: false,
    lazy: false,
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English',
        domain: 'en.nuxt-app.localhost'
      },
      {
        code: 'no',
        language: 'no-NO',
        name: 'Norwegian',
        domain: 'no.nuxt-app.localhost'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        name: 'Français',
        domain: 'fr.nuxt-app.localhost'
      }
    ],
    defaultLocale: 'ja'
  }
})
