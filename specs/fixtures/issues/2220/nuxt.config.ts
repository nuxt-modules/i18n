import locales from './locales'

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales,
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    strategy: 'no_prefix'
  }
})
