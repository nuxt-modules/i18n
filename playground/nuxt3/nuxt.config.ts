import { defineNuxtConfig } from 'nuxt3'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  buildModules: ['@nuxt/i18n'],

  // FIXME: type errors ...
  i18n: {
    langDir: 'locales',
    locales: [
      {
        code: 'en',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'ja',
        file: 'ja.json',
        name: 'Japanses'
      },
      {
        code: 'fr',
        file: 'fr.json',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    vueI18n: {
      legacy: false,
      fallbackLocale: 'en'
    }
  }
})
