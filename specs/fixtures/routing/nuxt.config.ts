import { STRATEGIES } from '../../../src/constants'

export default defineNuxtConfig({
  // devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: ['en', 'ja'],
    detectBrowserLanguage: false
  }
})
