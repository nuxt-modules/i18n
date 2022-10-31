import Module1 from './module1'
import type { NuxtApp } from 'nuxt/dist/app/index'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [Module1, '@nuxtjs/i18n'],

  vite: {
    build: {
      minify: false
    }
  },

  // app: {
  //   pageTransition: {
  //     name: 'foo',
  //     onBeforeEnter: async (...args: unknown[]) => {
  //       console.log('global onBeforeEnter', ...args)
  //     }
  //   }
  // },

  i18n: {
    langDir: 'locales',
    lazy: true,
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'en.json',
        // domain: 'localhost',
        name: 'English'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.json',
        domain: 'mydomain.com',
        name: 'Japanses'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: 'fr.json',
        domain: 'mydomain.fr',
        name: 'Français'
      }
    ],
    // trailingSlash: true,
    debug: true,
    defaultLocale: 'en',
    // strategy: 'no_prefix',
    // strategy: 'prefix',
    // rootRedirect: '/ja/about-ja',
    // strategy: 'prefix_and_default',
    // parsePages: false,
    dynamicRouteParams: true,
    pages: {
      about: {
        ja: '/about-ja'
      }
    },
    // differentDomains: true,
    skipSettingLocaleOnNavigate: true,
    detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   alwaysRedirect: false
    //   // cookieKey: 'i18n_redirected',
    //   // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    onBeforeLanguageSwitch: (oldLocale: string, newLocale: string, initial: boolean, nuxt: NuxtApp) => {
      console.log('onBeforeLanguageSwitch', oldLocale, newLocale, initial)
    },
    onLanguageSwitched: (oldLocale: string, newLocale: string) => {
      console.log('onLanguageSwitched', oldLocale, newLocale)
    },
    // vueI18n: './vue-i18n.options.ts'
    vueI18n: {
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en'
      // messages: {
      //   ja: {
      //     hello: 'こんにちは！'
      //   }
      // }
      // fallbackLocale: {
      //   en: ['ja', 'fr', 'en-US'],
      //   ja: ['en', 'fr', 'ja-JP'],
      //   fr: ['en', 'ja', 'fr-FR']
      // }
    }
  }
})
