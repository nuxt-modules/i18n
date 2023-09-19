export default defineNuxtConfig({
  ssr: true,
  components: true,
  imports: {
    autoImport: false
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    lazy: true,
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English',
        file: 'en.js'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        name: '日本語',
        file: 'ja.js'
      }
    ],
    strategy: 'prefix',
    defaultLocale: 'en',
    experimental: {
      jsTsFormatResource: true
    },
    // debug: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieSecure: true,
      fallbackLocale: 'en',
      redirectOn: 'no prefix'
    }
  }
})
