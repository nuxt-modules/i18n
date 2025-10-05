import pkg from '../package.json'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxt/scripts', 'nuxt-og-image', 'nuxt-llms'],
  routeRules: {
    // default
    '/': { prerender: true },
    '/docs': { redirect: '/docs/getting-started' },
    '/api/search.json': { prerender: true }
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
      version: pkg.version,
      scripts: {
        cloudflareWebAnalytics: {
          // NUXT_PUBLIC_SCRIPTS_CLOUDFLARE_WEB_ANALYTICS_TOKEN
          token: ''
        }
      }
    }
  },

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

  llms: {
    domain: 'https://i18n.nuxtjs.org',
    title: 'Nuxt i18n Docs',
    description: 'Nuxt i18n is a powerful internationalization (i18n) module for Nuxt powered by Vue i18n.',
    full: {
      title: 'Nuxt i18n Docs',
      description: 'The complete Nuxt i18n documentation written in Markdown (MDC syntax).'
    }
  },

  mdc: {
    highlight: {
      noApiRoute: false
    }
  },

  css: ['~/assets/css/main.css'],

  typescript: { strict: false },

  $development: {
    scripts: {
      enabled: false
    }
  },

  scripts: {
    registry: {
      cloudflareWebAnalytics: true
    }
  },

  compatibilityDate: '2024-09-26'
})
