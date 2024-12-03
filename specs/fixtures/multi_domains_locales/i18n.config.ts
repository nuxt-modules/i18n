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
      pages: {
        blog: {
          article: "Cette page d'article de blog"
        }
      },
      parent: {
        text: 'Test de la voie parentale',
        child: {
          text: 'Test de parcours pour enfants'
        }
      }
    },
    en: {
      welcome: 'Welcome',
      home: 'Homepage',
      profile: 'Profile',
      about: 'About us',
      posts: 'Posts',
      dynamic: 'Dynamic',
      pages: {
        blog: {
          article: 'This is blog article page'
        }
      },
      parent: {
        text: 'Parent route test',
        child: {
          text: 'Child route test'
        }
      }
    },
    no: {
      welcome: 'Velkommen',
      home: 'Hjemmeside',
      profile: 'Profil',
      about: 'Om oss',
      posts: 'Artikkeler',
      dynamic: 'Dynamic',
      pages: {
        blog: {
          article: 'Dette er bloggartikkelsiden'
        }
      },
      parent: {
        text: 'Forældrerutetest',
        child: {
          text: 'Børns rute test'
        }
      }
    }
  },
  fallbackLocale: 'en'
}
