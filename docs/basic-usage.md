# Basic Usage

To quickly get started with **nuxt-i18n**, you can simply configure a list of languages supported in your project and setup translations through `vueI18n` option:

```js
{
  modules: [
    ['nuxt-i18n', {
      locales: [
        { code: 'en' },
        { code: 'fr' },
        { code: 'es' }
      ],
      defaultLocale: 'en',
      vueI18n: {
        fallbackLocale: 'en',
        messages: {
          en: {
            welcome: 'Welcome'
          },
          fr: {
            welcome: 'Bienvenue'
          },
          es: {
            welcome: 'Bienvenido'
          }
        }
      }
    }]
  ]
}
```

With this setup, **nuxt-i18n** generates localized URLs for all your pages, using the locale code provided in the `locales` option as the prefix, except for the `defaultLocale`.

The `vueI18n` is passed as is to **vue-i18n**, refer to the [doc](https://kazupon.github.io/vue-i18n/) for available options.

## nuxt-link

When rendering internal links in you app using `<nuxt-link>`, you need to get proper URLs for the current locale. To do this, **nuxt-i18n **registers a global mixin that provides some helper functions:

* `localePath` – Returns the localized URL for a given page. The first parameter can be either the name of the route or an object for more complex routes. A locale code can be passed as the second parameter to generate a link for a specific language:

```html
<nuxt-link :to="localePath('index')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('index', 'en')">Homepage in English</nuxt-link>
<nuxt-link :to="localePath({ name: 'category-slug', params: { slug: category.slug } })">
  {{ category.title }}
</nuxt-link>
```

Note that `localePath` uses the route's base name to generate the localized URL. The base name corresponds to the names Nuxt generates when parsing your `pages/` directory, more info in [Nuxt's doc](https://nuxtjs.org/guide/routing).

* `switchLocalePath` – Returns a link to the current page in another language:

```html
<nuxt-link :to="switchLocalePath('en')">English</nuxt-link>
<nuxt-link :to="switchLocalePath('fr')">Français</nuxt-link>
```



