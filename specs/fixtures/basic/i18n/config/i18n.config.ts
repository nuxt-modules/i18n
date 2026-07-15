// messages importable from the locales directory without being configured in `locales[].files` (#3404)
import enLocale from '../locales/en'
import frLocale from '../locales/fr'

export default {
  legacy: false,
  locale: 'en',
  messages: {
    fr: {
      welcome: 'Bienvenue',
      home: 'Accueil',
      profile: 'Profil',
      about: 'À propos',
      posts: 'Articles',
      dynamic: 'Dynamique',
      htmlMessage: 'Exemple de <strong>traduction</strong>',
      pages: {
        blog: {
          article: "Cette page d'article de blog"
        }
      },
      ...frLocale
    },
    en: {
      welcome: 'Welcome',
      home: 'Homepage',
      profile: 'Profile',
      about: 'About us',
      posts: 'Posts',
      dynamic: 'Dynamic',
      htmlMessage: '<strong>Translation</strong> example',
      pages: {
        blog: {
          article: 'This is blog article page'
        }
      },
      ...enLocale
    }
  },
  modifiers: {
    // @ts-ignore
    snakeCase: (str: string) => str.split(' ').join('-')
  },
  fallbackLocale: 'en'
}
