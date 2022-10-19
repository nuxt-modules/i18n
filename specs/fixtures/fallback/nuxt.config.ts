// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    lazy: false,
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: ['fr', 'ja', 'en'],
    vueI18n: {
      legacy: false,
      fallbackLocale: 'en',
      messages: {
        en: {
          home: 'Homepage',
          about: 'About us',
          posts: 'Posts',
          dynamic: 'Dynamic'
        },
        fr: {
          home: 'Accueil',
          about: 'À propos',
          posts: 'Articles',
          dynamic: 'Dynamique'
        }
      }
    }
  }
})
