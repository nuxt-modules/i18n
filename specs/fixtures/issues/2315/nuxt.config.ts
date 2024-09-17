// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    bundle: {
      compositionOnly: false
    },
    types: 'legacy',
    locales: ['en'],
    defaultLocale: 'en'
  }
})
