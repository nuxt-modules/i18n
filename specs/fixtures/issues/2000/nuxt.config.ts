// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    experimental: {
      jsTsFormatResource: true
    },
    defaultLocale: 'en',
    langDir: 'locales',
    lazy: true,
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.ts',
        name: 'English'
      }
    ]
  }
})
