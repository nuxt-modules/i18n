// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
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
  },
  site: {
    url: 'https://abwaab.com'
  }
})
