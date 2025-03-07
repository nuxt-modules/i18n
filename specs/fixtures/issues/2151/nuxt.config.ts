export default defineNuxtConfig({
  ssr: true,
  components: true,
  imports: {
    autoImport: false
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    restructureDir: false,
    lazy: true,
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English',
        file: 'en.js'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        name: '日本語',
        file: 'ja.js'
      }
    ],
    strategy: 'prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieSecure: true,
      fallbackLocale: 'en',
      redirectOn: 'no prefix'
    }
  }
})
