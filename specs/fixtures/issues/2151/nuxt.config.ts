export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
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
    // debug: true,
    detectBrowserLanguage: {
      useCookie: true,
      cookieSecure: true,
      fallbackLocale: 'en',
      redirectOn: 'no prefix'
    }
  }
})
