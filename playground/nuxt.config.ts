import { defineNuxtConfig } from 'nuxt'
// @ts-ignore
import I18nModule from '../dist/module.mjs'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [I18nModule],

  vite: {
    build: {
      minify: false
    }
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
    debug: true,
    defaultLocale: 'en',
    strategy: 'no_prefix',
    // strategy: 'prefix',
    // strategy: 'prefix_and_default',
    pages: {
      about: {
        ja: '/about-ja'
      }
    },
    // detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   // alwaysRedirect: true,
    //   // useCookie: false
    //   // cookieKey: 'i18n_redirected',
    //   // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    onBeforeLanguageSwitch: (oldLocale, newLocale, initial, context) => {
      console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initial)
    },
    onLanguageSwitched: (oldLocale, newLocale) => {
      console.log('onLanguageSwitched', oldLocale, newLocale)
    },
    vueI18n: {
      legacy: false,
      locale: 'en'
      // fallbackLocale: 'en',
      // fallbackLocale: {
      //   en: ['ja', 'fr', 'en-US'],
      //   ja: ['en', 'fr', 'ja-JP'],
      //   fr: ['en', 'ja', 'fr-FR']
      // }
    }
  }
})
