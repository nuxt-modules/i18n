// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    baseUrl: 'http://localhost:3000',
    langDir: 'lang',
    defaultLocale: 'fr',
    detectBrowserLanguage: false
  }
})
