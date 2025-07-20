// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['../common'],
  modules: ['@nuxtjs/i18n'],

  i18n: {
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
    differentDomains: true,
    defaultLocale: 'ja'
  }
})
