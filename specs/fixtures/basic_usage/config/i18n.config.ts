export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  messages: {
    fr: {
      welcome: 'Bienvenue',
      home: 'Accueil',
      profile: 'Profil',
      aboutSite: 'À propos de ce site',
      snakeCaseText: "@.snakeCase:{'aboutSite'}",
      pascalCaseText: "@.pascalCase:{'aboutSite'}",
      hello: 'Bonjour le monde!',
      modifier: "@.snakeCase:{'hello'}"
    },
    en: {
      welcome: 'Welcome',
      home: 'Homepage',
      profile: 'Profile',
      hello: 'Hello world!',
      modifier: "@.snakeCase:{'hello'}",
      fallbackMessage: 'This is the fallback message!'
    },
    nl: {
      aboutSite: 'Over deze site',
      snakeCaseText: "@.snakeCase:{'aboutSite'}",
      pascalCaseText: "@.pascalCase:{'aboutSite'}"
    }
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str: string) => str.split(' ').join('-')
  }
}))
