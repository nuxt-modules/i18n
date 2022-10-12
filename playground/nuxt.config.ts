// @ts-ignore
import I18nModule from '../dist/module.mjs'
import Module1 from './module1'

import type { NuxtApp } from 'nuxt/dist/app/index'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [Module1, I18nModule],

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
        domain: 'foo.localhost',
        name: 'English'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.json',
        domain: 'github.com',
        name: 'Japanses'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
        domain: 'google.com',
        name: 'Français'
      }
    ],
    // trailingSlash: true,
    debug: true,
    defaultLocale: 'en',
    // strategy: 'no_prefix',
    // strategy: 'prefix',
    // strategy: 'prefix_and_default',
    // parsePages: false,
    pages: {
      about: {
        ja: '/about-ja'
      }
    },
    differentDomains: true,
    detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   // alwaysRedirect: true,
    //   useCookie: false
    //   // cookieKey: 'i18n_redirected',
    //   // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    onBeforeLanguageSwitch: (oldLocale: string, newLocale: string, initial: boolean, context: NuxtApp) => {
      console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initial)
    },
    onLanguageSwitched: (oldLocale: string, newLocale: string) => {
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
