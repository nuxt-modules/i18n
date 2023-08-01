export default defineAppConfig({
  i18n: {
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
          welcome: 'Welcome app config',
          home: 'Homepage',
          profile: 'Profile'
        }
      }
    }
  }
})
