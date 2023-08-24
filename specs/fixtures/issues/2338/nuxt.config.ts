// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [{ code: 'nl', iso: 'nl-NL' }],
    debug: false,
    defaultLocale: 'nl',
    strategy: 'prefix_except_default'
  }
})
