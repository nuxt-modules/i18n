import { defineNuxtConfig } from '@nuxt/bridge'

export default defineNuxtConfig({
  buildModules: ['@nuxt/i18n'],

  bridge: {
    meta: true,
    vite: false
  },

  i18n: {
    langDir: 'locales',
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.json',
        name: 'Japanses'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
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
