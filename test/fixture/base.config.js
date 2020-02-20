const { resolve } = require('path')

module.exports = {
  rootDir: resolve(__dirname, '../..'),
  dev: false,
  build: {
    babel: {
      presets ({ isServer }) {
        return [
          [
            require.resolve('@nuxt/babel-preset-app'),
            {
              buildTarget: isServer ? 'server' : 'client',
              corejs: { version: 3 }
            }
          ]
        ]
      }
    },
    quiet: true
  },
  render: {
    resourceHints: false
  },
  modules: [
    { handler: require('../..') }
  ],
  i18n: {
    seo: true,
    baseUrl: 'nuxt-app.localhost',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'fr',
        iso: 'fr-FR',
        name: 'Français'
      }
    ],
    defaultLocale: 'en',
    lazy: false,
    vueI18nLoader: true,
    vueI18n: {
      messages: {
        fr: {
          home: 'Accueil',
          about: 'À propos',
          posts: 'Articles'
        },
        en: {
          home: 'Homepage',
          about: 'About us',
          posts: 'Posts'
        }
      },
      fallbackLocale: 'en'
    },
    vuex: {
      syncLocale: true,
      syncMessages: true
    }
  }
}
