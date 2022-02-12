import { defineNuxtConfig } from '@nuxt/bridge'

export default defineNuxtConfig({
  buildModules: ['@nuxt/i18n'],

  bridge: {
    meta: true,
    vite: false
  },

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
