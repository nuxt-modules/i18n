import Module1 from './module1'
import type { NuxtApp } from 'nuxt/dist/app/index'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [Module1, '@nuxtjs/i18n', '@nuxt/devtools'],

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
        code: 'en-GB',
        iso: 'en-GB',
        files: ['en.json', 'en-GB.js'],
        name: 'English (UK)'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.js',
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
    // strategy: 'prefix_and_default',
    strategy: 'prefix_except_default',
    // rootRedirect: '/ja/about-ja',
    dynamicRouteParams: true,
    // customRoutes: 'config',
    pages: {
      about: {
        ja: '/about-ja'
      }
    },
    // differentDomains: true,
    // skipSettingLocaleOnNavigate: true,
    detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   // alwaysRedirect: true
    //   // cookieKey: 'i18n_redirected',
    //   // // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    // vueI18n: './vue-i18n.options.ts'
    vueI18n: {
      legacy: false,
      locale: 'en',
      fallbackLocale: 'fr'
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
