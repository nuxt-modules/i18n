// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  vite: {
    build: {
      minify: false
    }
  },

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
        files: ['en.ts'],
        name: 'English'
      }
    ]
  }
})
