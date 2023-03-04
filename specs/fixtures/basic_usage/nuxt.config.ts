// https://nuxt.com/docs/guide/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

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
