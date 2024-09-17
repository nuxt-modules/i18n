// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    locales: ['fr', 'nl', 'en'],
    defaultLocale: 'nl',
    detectBrowserLanguage: false,
    vueI18n: './i18n.config.ts'
  }
})
