export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxtjs/fontaine', '@nuxtjs/google-fonts', 'nuxt-og-image'],
  routeRules: {
    // v7
    '/docs/v7/callbacks': { prerender: true, ssr: false },
    '/docs/v7/callbacks/': { prerender: true, ssr: false },
    '/docs/v7': { prerender: true, ssr: false },
    '/docs/v7/': { prerender: true, ssr: false },

    // default
    '/': { prerender: true },
    '/docs': { redirect: '/docs/getting-started' },
    '/api/search.json': { prerender: true },

    // v8
    '/docs/v8': { redirect: '/docs/v8/getting-started' }
  },

  vite: {
    $client: {
      build: {
        rollupOptions: {
          output: {
            chunkFileNames: '_nuxt/[name]-[hash].js',
            entryFileNames: '_nuxt/[name]-[hash].js'
          }
        }
      }
    }
  },

  // SEO
  site: { url: 'https://i18n.nuxtjs.org' },

  nitro: {
    prerender: {
      crawlLinks: true
    }
  },

  // Nuxt UI & UI Pro
  ui: { icons: ['heroicons', 'simple-icons'] },

  // special license for nuxt & nuxt-modules orgs
  uiPro: { license: 'oss' },

  hooks: {
    'components:extend': components => {
      // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
      const globals = components.filter(c => ['UButton', 'UIcon'].includes(c.pascalName))

      for (const comp of globals) {
        comp.global = true
      }

      // Related to https://github.com/nuxt/nuxt/pull/22558
      // Adding all global components to the main entry
      // To avoid lagging during page navigation on client-side
      for (const comp of components) {
        if (comp.global) {
          comp.global = 'sync'
        }
      }
    }
  },

  // Nuxt Content
  content: { highlight: { langs: ['jsonc'] } },

  // Fonts
  fontMetrics: { fonts: ['DM Sans'] },

  googleFonts: {
    display: 'swap',
    download: true,
    families: { 'DM+Sans': [400, 500, 600, 700] }
  },

  devtools: { enabled: true },
  typescript: { strict: false },
  compatibilityDate: '2024-09-26'
})
