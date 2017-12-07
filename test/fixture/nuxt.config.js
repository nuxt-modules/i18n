module.exports = {
  srcDir: __dirname,
  dev: false,
  render: {
    resourceHints: false
  },
  modules: [
    ['@@', {
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
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        }
      },
      ignoreRoutes: [
        'fr-notlocalized'
      ]
    }]
  ]
}
