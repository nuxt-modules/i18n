import Module1 from './app/module1'
import LayerModule from './app/layer-module'
import ModuleExperimental from './app/module-experimental'
import { fileURLToPath } from 'mlly'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  experimental: {
    typedPages: true
  },

  future: {
    compatibilityVersion: 4
  },

  alias: {
    '@nuxtjs/i18n': fileURLToPath(new URL('../src/module', import.meta.url))
  },

  vite: {
    // Prevent reload by optimizing dependency before discovery
    optimizeDeps: {
      include: ['@unhead/vue']
    },
    build: {
      minify: false
    }
  },

  extends: ['layers/i18n-layer'],

  modules: [Module1, ModuleExperimental, LayerModule, '@nuxtjs/i18n', '@nuxt/devtools'],

  // debug: false,

  i18n: {
    debug: false,
    // restructureDir: 'i18n',
    experimental: {
      localeDetector: './localeDetector.ts',
      switchLocalePathLinkSSR: true,
      autoImportTranslationFunctions: true,
      typedPages: true,
      typedOptionsAndMessages: 'default'
    },
    compilation: {
      strictMessage: false,
      escapeHtml: true
    },
    langDir: 'locales',
    lazy: true,
    baseUrl: 'http://localhost:3000',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'en.json',
        // domain: 'localhost',
        name: 'English'
      },
      {
        code: 'en-GB',
        language: 'en-GB',
        files: ['en.json', 'en-GB.js', 'en-KK.js', 'en-US.yaml', 'en-CA.json5'],
        name: 'English (UK)'
      },
      {
        code: 'ja',
        language: 'ja-JP',
        file: 'ja.ts',
        domain: 'mydomain.com',
        name: 'Japanese'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        file: 'fr.json',
        domain: 'project-fr.example.com',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    pages: {
      history: {
        ja: '/history-ja'
      },
      about: {
        ja: '/about-ja'
      }
    },
    skipSettingLocaleOnNavigate: true,
    detectBrowserLanguage: false,
    // detectBrowserLanguage: {
    //   // useCookie: true
    //   // alwaysRedirect: true
    //   // cookieKey: 'i18n_redirected',
    //   // // cookieKey: 'my_custom_cookie_name',
    //   // redirectOn: 'root'
    // },
    vueI18n: 'vue-i18n.options.ts'
  }
})
