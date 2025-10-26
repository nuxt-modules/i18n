export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  ssr: true,
  components: true,
  imports: {
    autoImport: false,
  },
  i18n: {
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English',
        file: 'en.js',
      },
      {
        code: 'ja',
        language: 'ja-JP',
        name: '日本語',
        file: 'ja.js',
      },
    ],
    strategy: 'prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieSecure: true,
      fallbackLocale: 'en',
      redirectOn: 'no prefix',
    },
  },
})
