import { defineNuxtConfig } from 'nuxt'
import I18nModule from '../../..'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [I18nModule],

  i18n: {
    baseUrl: 'http://localhost:3000',
    langDir: 'lang',
    /*
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json5',
        name: 'Français'
      }
    ],
    */
    defaultLocale: 'fr',
    detectBrowserLanguage: false,
    vueI18n: {
      legacy: false,
      messages: {},
      fallbackLocale: 'en'
    }
  }
})
