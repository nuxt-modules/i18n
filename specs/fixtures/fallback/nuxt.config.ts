// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    lazy: false,
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: ['fr', 'ja', 'en']
  }
})
