import i18nModule from './i18n-module'

// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  // This reverts the new srcDir default from `app` back to your root directory
  srcDir: '.',
  // This specifies the directory prefix for `app/router.options.ts` and `app/spa-loading-template.html`
  dir: {
    app: 'app'
  },
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
  modules: [i18nModule, '@nuxtjs/i18n'],
  i18n: {
    baseUrl: 'http://localhost:3000',
    // langDir: 'lang',
    // defaultLocale: 'fr',
    detectBrowserLanguage: false,
    compilation: {
      strictMessage: false
    },
    defaultLocale: 'en',
    langDir: 'lang',
    lazy: true,
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        file: 'lazy-locale-en.json',
        name: 'English'
      },
      {
        code: 'en-GB',
        iso: 'en-GB',
        files: ['lazy-locale-en.json', 'lazy-locale-en-GB.js', 'lazy-locale-en-GB.ts'],
        name: 'English (UK)'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        file: { path: 'lazy-locale-fr.json5', cache: false },
        name: 'Français'
      }
    ]
  }
})
