import Module1 from './module1'
import LayerModule from './layer-module'
import type { NuxtApp } from 'nuxt/dist/app/index'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['layers/i18n-layer'],
  modules: [
    (_, nuxt) => {
      console.log(nuxt.options._installedModules)
    },
    Module1,
    LayerModule,
    '@nuxtjs/i18n',
    '@nuxt/devtools'
  ],
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
  debug: false,
  i18n: {
    experimental: {
      jsTsFormatResource: true
    },
    precompile: {
      strictMessage: false,
      escapeHtml: true
    },
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
        files: ['en.json', 'en-GB.js', 'en-KK.js'],
        name: 'English (UK)'
      },
      {
        code: 'ja',
        iso: 'ja-JP',
        file: 'ja.ts',
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
    debug: false,
    defaultLocale: 'en',
    // strategy: 'no_prefix',
    // strategy: 'prefix',
    // strategy: 'prefix_and_default',
    strategy: 'prefix_except_default',
    // rootRedirect: '/ja/about-ja',
    dynamicRouteParams: true,
    // customRoutes: 'config',
    pages: {
      history: {
        ja: '/history-ja'
      },
      about: {
        ja: '/about-ja'
      }
    },
    // differentDomains: true,
    // skipSettingLocaleOnNavigate: true,
    // detectBrowserLanguage: false,
    detectBrowserLanguage: {
      useCookie: true
      // alwaysRedirect: true
      // cookieKey: 'i18n_redirected',
      // // cookieKey: 'my_custom_cookie_name',
      // redirectOn: 'root'
    },
    vueI18n: './vue-i18n.options.ts'
  }
})
