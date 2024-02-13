// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  debug: false,
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix',
    rootRedirect: {
      statusCode: 418,
      path: 'test-route'
    },
    locales: [
      {
        code: 'en',
        iso: 'en-US'
      },
      {
        code: 'fr',
        iso: 'fr-FR'
      }
    ]
  }
})
