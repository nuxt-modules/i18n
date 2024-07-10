// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'https://abwaab.com',
    locales: [
      {
        code: 'en',
        country: '',
        iso: 'en',
        lang: 'en',
        file: 'en-en.js',
        dir: 'ltr'
      },
      {
        code: 'ar',
        country: '',
        iso: 'ar',
        lang: 'ar',
        file: 'ar-ar.js',
        dir: 'rtl'
      }
    ],

    strategy: 'prefix_and_default',
    detectBrowserLanguage: false,
    defaultLocale: 'ar',
    lazy: true,
    langDir: 'i18n/'
  }
})
