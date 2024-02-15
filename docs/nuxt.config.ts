export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: ['@nuxt/content', '@nuxt/ui', '@nuxtjs/fontaine', '@nuxtjs/google-fonts', 'nuxt-og-image'],
  routeRules: { '/api/search.json': { prerender: true } },

  // SEO
  site: { url: 'https://i18n.nuxtjs.org' },

  // Nuxt UI & UI Pro
  ui: { icons: ['heroicons', 'simple-icons'] },
  uiPro: { license: 'oss' }, // special license for nuxt & nuxt-modules orgs
  hooks: {
    // Define `@nuxt/ui` components as global to use them in `.md` (feel free to add those you need)
    'components:extend': components => {
      const globals = components.filter(c => ['UButton', 'UIcon'].includes(c.pascalName))

      globals.forEach(c => (c.global = true))
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
  typescript: { strict: false }
})
