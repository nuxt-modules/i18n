// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['../common'],
  modules: ['@nuxtjs/i18n'],

  srcDir: '.',
  i18n: {
    baseUrl: 'http://localhost:3000',
    // strategy: 'prefix',
    locales: [
      {
        code: 'en',
        language: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    vueI18n: './config/i18n.config.ts'
  }
})
