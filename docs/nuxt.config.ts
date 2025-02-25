import pkg from '../package.json'

export default defineNuxtConfig({
  modules: ['@nuxt/ui-pro', '@nuxt/content', 'nuxt-og-image'],
  routeRules: {
    // v7
    '/docs/v7': { redirect: '/docs/v7/setup' },

    // default
    '/': { prerender: true },
    '/docs': { redirect: '/docs/getting-started' },
    '/api/search.json': { prerender: true },

    // v8
    '/docs/v8': { redirect: '/docs/v8/getting-started' }
  },

  // SEO
  site: { url: 'https://i18n.nuxtjs.org' },

  nitro: {
    prerender: {
      crawlLinks: true
    }
  },

  runtimeConfig: {
    public: {
      version: pkg.version
    }
  },

  // Nuxt UI & UI Pro
  ui: { icons: ['heroicons', 'simple-icons'] },

  // special license for nuxt & nuxt-modules orgs
  uiPro: { license: 'oss' },

  // Nuxt Content
  content: {
    build: {
      markdown: {
        highlight: {
          langs: ['bash', 'js', 'ts', 'typescript', 'diff', 'vue', 'json', 'jsonc', 'yml', 'css', 'mdc']
        }
      }
    }
  },

  mdc: {
    highlight: {
      noApiRoute: false
    }
  },

  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },
  typescript: { strict: false },
  compatibilityDate: '2024-09-26'
})
