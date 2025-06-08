import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    strategy: 'no_prefix',
    // When using prefix_except_default strategy
    detectBrowserLanguage: false,
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', file: 'fr.json', name: 'Français' },
      { code: 'en', file: 'en.json', name: 'English' }
    ]
  },
  compatibilityDate: '2024-07-23'
})
