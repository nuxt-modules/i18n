export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    baseUrl: 'http://localhost:3000',
    locales: ['en', 'ja'],
    detectBrowserLanguage: false
  },

  hooks: {
    'i18n:filterPages'(pages: any[]) {
      // disable /admin prefixed pages
      for (const page of pages) {
        if (page.path.startsWith('/admin')) {
          page.meta = page.meta || {}
          page.meta.i18n = false
        }
      }
    }
  }
})
