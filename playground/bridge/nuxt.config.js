import { defineNuxtConfig } from '@nuxt/bridge'

export default defineNuxtConfig({
  buildModules: ['@nuxtjs/i18n'],

  bridge: {
    meta: true,
    vite: false
  },

  i18n: {
    langDir: 'locales',
    lazy: true,
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
    // strategy: 'prefix_and_default',
    pages: {
      about: {
        ja: '/about-ja'
      }
    },
    // detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   cookieKey: 'i18n_redirected',
    //   redirectOn: 'all'
    // },
    onBeforeLanguageSwitch: (oldLocale, newLocale, initial, context) => {
      console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initial, context)
    },
    onLanguageSwitched: (oldLocale, newLocale) => {
      console.log('onLanguageSwitched', oldLocale, newLocale)
    },
    vueI18n: {
      legacy: false,
      fallbackLocale: 'en'
    }
  }
})
