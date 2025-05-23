// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'https://abwaab.com',
    locales: [
      {
        code: 'en',
        country: '',
        language: 'en',
        lang: 'en',
        file: 'en-en.js',
        dir: 'ltr'
      },
      {
        code: 'ar',
        country: '',
        language: 'ar',
        lang: 'ar',
        file: 'ar-ar.js',
        dir: 'rtl'
      }
    ],

    strategy: 'prefix_and_default',
    detectBrowserLanguage: false,
    defaultLocale: 'ar'
  }
})
