export default defineI18nConfig(() => ({
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
}))
