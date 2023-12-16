// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Francais'
      },
      {
        code: 'nl',
        iso: 'nl-NL',
        name: 'Nederlands'
      }
    ],
    bundle: {
      onlyLocales: ['en', 'fr']
    }
  }
})
