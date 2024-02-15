// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'ja',
    locales: [
      {
        code: 'ja',
        iso: 'ja-JP',
        name: 'Japanese'
      }
    ]
  }
})
