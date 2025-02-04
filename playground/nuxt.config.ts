// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4
  },

  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'ja', language: 'ja-JP', file: 'ja.json', name: 'Japanese' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: false
  }
})
