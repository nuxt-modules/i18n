// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.ts', name: 'English' },
      { code: 'ja', language: 'ja-JP', file: 'ja.json', name: 'Japanese' }
    ],
    lazy: true,
    defaultLocale: 'en'
    // experimental: {
    //   typedOptionsAndMessages: 'all'
    // }
  },

  compatibilityDate: '2025-02-04'
})
