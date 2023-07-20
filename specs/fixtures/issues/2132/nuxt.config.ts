export default defineNuxtConfig({
  ssr: true,
  components: true,

  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        name: '日本語'
      }
    ],
    strategy: 'prefix',
    defaultLocale: 'en',
    // debug: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieSecure: true,
      fallbackLocale: 'en',
      redirectOn: 'no prefix'
    }
  }
})
