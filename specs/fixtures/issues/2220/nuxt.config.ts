import locales from './locales'

export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    lazy: true,
    langDir: 'locales',
    locales,
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    strategy: 'no_prefix'
  }
})
