# Customize Routes

In some cases, you might want to translate URLs in addition to having them prefixed with the locale code, this can be achieved using the `routes` option:

```js
{
  modules: [
    ['nuxt-i18n', {
      locales: [
        { code: 'en' },
        { code: 'fr' }
      ],
      defaultLocale: 'en',
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
      }
    }]
  ]
}
```



