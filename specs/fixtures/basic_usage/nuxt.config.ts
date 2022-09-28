import { defineNuxtConfig } from 'nuxt'
import I18nModule from '../../..'

// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [I18nModule],

  i18n: {
    // debug: true,
    vueI18n: {
      legacy: false,
      locale: 'en',
      messages: {
        fr: {
          welcome: 'Bienvenue',
          home: 'Accueil',
          profile: 'Profil'
        },
        en: {
          welcome: 'Welcome',
          home: 'Homepage',
          profile: 'Profile'
        }
      }
    }
  }
})
