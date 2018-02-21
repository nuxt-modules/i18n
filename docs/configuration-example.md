# Configuration Example

```js
{
  modules: [
    ['nuxt-i18n', {
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
      noPrefixDefaultLocale: true,
      redirectRootToLocale: 'en',
      vueI18n: {
        messages: {
          fr: {
            home: 'Accueil',
            about: 'À propos',
            category: 'Catégorie'
          },
          en: {
            home: 'Homepage',
            about: 'About us',
            category: 'Category'
          }
        },
        fallbackLocale: 'en'
      },
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        },
        category: {
          fr: '/categorie'
        },
        'category/_slug': {
          fr: '/categorie/:slug'
        }
      },
      ignorePaths: [
        '/fr/notlocalized'
      ]
    }]
  ]
}
```



