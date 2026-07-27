export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    experimental: {
      prerenderMessages: true
    },
    locales: [
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'dyn', language: 'dy-DY', name: 'Dynamic', file: 'dyn.ts' },
      { code: 'fn', language: 'fn-FN', name: 'Function', file: 'fn.ts' }
    ]
  },

  compatibilityDate: '2025-03-30'
})
