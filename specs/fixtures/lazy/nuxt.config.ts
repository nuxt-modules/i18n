import i18nModule from './i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  extends: ['../common'],
  vite: {
    // Prevent reload by optimizing dependency before discovery
    optimizeDeps: {
      include: ['@unhead/vue']
    },
    // https://nuxt.com/blog/v3-11#chunk-naming
    // We change the chunk file name so we can detect file requests in our tests
    $client: {
      build: {
        rollupOptions: {
          output: {
            chunkFileNames: '_nuxt/[name].js',
            entryFileNames: '_nuxt/[name].js'
          }
        }
      }
    }
  },

  runtimeConfig: {
    public: {
      myKey: 'runtime-config-value',
      noServer: false
    }
  },
  modules: [i18nModule, '@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'http://localhost:3000',
    detectBrowserLanguage: false,
    compilation: {
      strictMessage: false
    },
    defaultLocale: 'en',
    langDir: 'lang',
    locales: [
      {
        code: 'en',
        language: 'en-US',
        file: 'lazy-locale-en.json',
        name: 'English'
      },
      {
        code: 'en-GB',
        language: 'en-GB',
        files: ['lazy-locale-en.json', 'lazy-locale-en-GB.js', 'lazy-locale-en-GB.ts', 'runtime-config-translation.js'],
        name: 'English (UK)'
      },
      {
        code: 'fr',
        language: 'fr-FR',
        file: { path: 'lazy-locale-fr.json5', cache: false },
        name: 'Français'
      }
    ]
  }
})
