# nuxt-i18n

> Add i18n to your [Nuxt](https://github.com/nuxt/nuxt.js) application

This module attempts to provide i18n features to Nuxt applications by installing and enabling [vue-i18n](https://github.com/kazupon/vue-i18n) as well as providing routing helpers to help you customize URLs for your languages.

> This module is a compilation of work that was developed to address some specific needs and it might not work as expected in other setups.
> Any help to improve the module and/or its documentation would be very appreciated! 

## Demo

Have a look at the example project to see the module in action: [nuxt-i18n-example](https://github.com/paulgv/nuxt-i18n-example)

## Install

Install the module using Yarn or NPM:

```sh
yarn add nuxt-i18n # or npm i nuxt-i18n -S
```

Add **nuxt-i18n** to Nuxt's config:

```js
// nuxt.config.js

module.exports = {
  modules: ['nuxt-i18n']
}
```

## Configuration

The module can be configured directly in the `modules` key:

```js
// nuxt.config.js

module.exports = {
  modules: [
    ['nuxt-i18n', {
      // options
    }]
  ]
}
```

Or via the `i18n` key:

```js
// nuxt.config.js

module.exports = {
  modules: ['nuxt-i18n'],
  i18n: {
    // options
  }
}
```

## Configuration example

Here's an example configuration for an app that supports English and French, with English as the default and fallback language and some custom routes. You'll probably want to split the configuration accross multiple files to prevent bloating `nuxt.config.js`.

```js
// nuxt.config.js

module.exports = {
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
      fallbackLocale: 'en',
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
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        },
        category: {
          fr: '/categorie'
        },
        'category-slug': {
          fr: '/categorie/:slug'
        }
      }
    }]
  ]
}
```

## Usage

### Translations

Messages translation is achieved by **vue-i18n** using the `messages` passed in the module's configuration. Refer to [vue-i18n's doc](https://kazupon.github.io/vue-i18n/en/) for more info.

### Routing

This module overrides Nuxt default routes to add locale prefixes to every page.

Let's say your app supports English (default) and French, and you have this files structure for your pages:

```
pages/
├── index.vue
├── about.vue
```

The resulting routes would look like this:

```js
[
  {
    path: "/",
    component: _3237362a,
    name: "index-en"
  },
  {
    path: "/fr/",
    component: _3237362a,
    name: "index-fr"
  },
  {
    path: "/about",
    component: _71a6ebb4,
    name: "about-en"
  },
  {
    path: "/fr/about",
    component: _71a6ebb4,
    name: "about-fr"
  }
]
```

You can also customize the path for each route/language using the `routes` key in your configuration (see configuration example above).

In the app, you'll need to preserve the language option when showing links. To do this, this module registers a global mixin that provides some helper functions:

- `getLocalizedRoute` – Returns the localized URL for a given page. The first parameter can be either the name of the route or an object for more complex routes. A locale code can be passed as the second parameter to generate a link for a specific language:

```vue
<nuxt-link :to="getLocalizedRoute('index')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="getLocalizedRoute('index', 'en')">Homepage in English</nuxt-link>
<nuxt-link
  :to="getLocalizedRoute({ name: 'category-slug', params: { slug: category.slug } })">
  {{ category.title }}
</nuxt-link>
```

> Note that `getLocalizedRoute` uses the route's base name to generate the localized URL. The base name corresponds to the names Nuxt generates when parsing your `pages/` directory, more info in [Nuxt's doc](https://nuxtjs.org/guide/routing).


- `getSwitchLocaleRoute` – Returns a link to the current page for another language passed:

```vue
<nuxt-link :to="getSwitchLocaleRoute('en')">English</nuxt-link>
<nuxt-link :to="getSwitchLocaleRoute('fr')">Français</nuxt-link>
```


## Options

| Option           | Type   | Description                                                                                                          |
|------------------|--------|----------------------------------------------------------------------------------------------------------------------|
| `locales`        | Array  | A list of objects that describes the locales available in your app, each object should contain at least a `code` key |
| `defaultLocale`  | String | The app's default locale, URLs for this language won't be prefixed with the locale code                              |
| `fallbackLocale` | String | Fallback locale used by vue-i18n when no message is available in the current language                                |
| `messages`       | Object | Translated message to use with vue-i18n                                                                              |
| `routes`         | Object | Custom routing configuration, if routes are omitted, Nuxt's default routes are used                                  |
