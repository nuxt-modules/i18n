import { defineNuxtConfig } from 'nuxt'
import I18nModule from '../../..'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [I18nModule],

  i18n: {
    lazy: false,
    baseUrl: 'http://localhost:3000',
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
    detectBrowserLanguage: false,
    vueI18n: {
      legacy: false,
      locale: 'en',
      messages: {
        fr: {
          welcome: 'Bienvenue',
          home: 'Accueil',
          profile: 'Profil',
          about: 'À propos',
          posts: 'Articles',
          dynamic: 'Dynamique'
        },
        en: {
          welcome: 'Welcome',
          home: 'Homepage',
          profile: 'Profile',
          about: 'About us',
          posts: 'Posts',
          dynamic: 'Dynamic'
        }
      },
      fallbackLocale: 'en'
    }
  }
})
