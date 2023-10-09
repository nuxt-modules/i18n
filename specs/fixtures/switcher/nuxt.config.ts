// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  vite: {
    build: {
      minify: false
    }
  },

  experimental: {
    reactivityTransform: true
  },

  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    skipSettingLocaleOnNavigate: true,
    detectBrowserLanguage: false
  },
  site: {
    url: 'http://localhost:3000'
  }
})
