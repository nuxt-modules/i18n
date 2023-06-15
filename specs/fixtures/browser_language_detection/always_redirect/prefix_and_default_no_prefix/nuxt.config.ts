// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    lazy: false,
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        name: '日本語'
      }
    ]
  }
})
