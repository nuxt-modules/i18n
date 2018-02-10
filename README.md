# nuxt-i18n
[![npm (scoped with tag)](https://img.shields.io/npm/v/nuxt-i18n/latest.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)
[![npm](https://img.shields.io/npm/dt/nuxt-i18n.svg?style=flat-square)](https://npmjs.com/package/nuxt-i18n)
[![CircleCI](https://img.shields.io/circleci/project/github/nuxt-community/nuxt-i18n.svg?style=flat-square)](https://circleci.com/gh/nuxt-community/nuxt-i18n)
[![Codecov](https://img.shields.io/codecov/c/github/nuxt-community/nuxt-i18n.svg?style=flat-square)](https://codecov.io/gh/nuxt-community/nuxt-i18n)
[![Dependencies](https://david-dm.org/nuxt-community/nuxt-i18n/status.svg?style=flat-square)](https://david-dm.org/nuxt-community/nuxt-i18n)
[![js-standard-style](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com)

> i18n for [Nuxt](https://github.com/nuxt/nuxt.js)

[📖 **Release Notes**](./CHANGELOG.md)

## Features

This module attempts to provide i18n features to Nuxt applications by installing and enabling [vue-i18n](https://github.com/kazupon/vue-i18n) as well as providing routing helpers to help you customize URLs for your languages.

## Setup
- Add `nuxt-i18n` dependency using yarn or npm to your project

```sh
yarn add nuxt-i18n
# npm i nuxt-i18n -S
```

- Add `nuxt-i18n` to `modules` section of `nuxt.config.js`

```js
{
  modules: [
    ['nuxt-i18n', { /* module options */ }],
 ]
}
```

## Usage

### Available languages

To configure your app's languages, use the `locales` option and the `defaultLocale` option if needed:

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
      // ...
    }]
  ]
}
```
These locales are used to generate the app's routes, the `code` will be used as the URL prefix (except for the default locale).

`locales` and `defaultLocale` are both added to `app.i18n` which means you can refer to them in any component via the `$i18n` property:

```vue
<nuxt-link
  v-for="(locale, index) in $i18n.locales"
  v-if="locale.code !== $i18n.locale"
  :key="index"
  :exact="true"
  :to="switchLocalePath(locale.code)">{{ locale.name }}</nuxt-link>
```

### Translations

Messages translation is achieved by **vue-i18n** which you can configure via the `vueI18n` option:

```js
{
  modules: [
    ['nuxt-i18n', {
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
      }
      // ...
    }]
  ]
}
```

Refer to [vue-i18n's doc](https://kazupon.github.io/vue-i18n/en/) for more info.

### Routing

**nuxt-i18n** overrides Nuxt default routes to add locale prefixes to every URL.

> If you define a `defaultLocale`, the URL prefix is omitted for this language

Say your app supports English (as the default language) and French, and you have this files structure for your pages:

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

You can also customize the path for each route/language using the `routes` key in your configuration, this can be useful if you want to have different paths depending on the user's language (see configuration example below).

In the app, you'll need to preserve the language when generating URLs. To do this, **nuxt-i18n** registers a global mixin that provides some helper functions:

- `localePath` – Returns the localized URL for a given page. The first parameter can be either the name of the route or an object for more complex routes. A locale code can be passed as the second parameter to generate a link for a specific language:

```vue
<nuxt-link :to="localePath('index')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('index', 'en')">Homepage in English</nuxt-link>
<nuxt-link
  :to="localePath({ name: 'category-slug', params: { slug: category.slug } })">
  {{ category.title }}
</nuxt-link>
```

> Note that `localePath` uses the route's base name to generate the localized URL. The base name corresponds to the names Nuxt generates when parsing your `pages/` directory, more info in [Nuxt's doc](https://nuxtjs.org/guide/routing).


- `switchLocalePath` – Returns a link to the current page in another language:

```vue
<nuxt-link :to="switchLocalePath('en')">English</nuxt-link>
<nuxt-link :to="switchLocalePath('fr')">Français</nuxt-link>
```

> You might want to add `:exact=true` to your `<nuxt-link>` to prevent the `active-class` from being added somewhere you did not expect


### SEO

By default, **nuxt-i18n** adds some metadata to help with your pages SEO. This can be disabled by setting `seo` option to `false`.
Here's what it does:

- Add a *lang* attribute containing the current locale's ISO code to the `<html>` tag.
- Generate `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. For each language, the ISO code is used as `hreflang` attribute's value.

To customize SEO metadata for any page, simply declare your own `head ()` method, have a look at [lib/templates/i18n.seo.plugin.js](lib/templates/i18n.seo.plugin.js) if you want to copy some of **nuxt-i18n**'s logic.


## Options

| Option                  | Type    | Default | Description                                                                                                                                     |
|-------------------------|---------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| `locales`               | Array   |         | A list of objects that describes the locales available in your app, each object should contain at least a `code` key                            |
| `defaultLocale`         | String  |         | The app's default locale, URLs for this language won't be prefixed with the locale code                                                         |
| `vueI18n`               | Object  |         | Configuration options for vue-i18n, refer to [the doc](http://kazupon.github.io/vue-i18n/en/api.html#constructor-options) for supported options |
| `routes`                | Object  |         | Custom routing configuration, if routes are omitted, Nuxt's default routes are used                                                             |
| `ignorePaths`           | Array   |         | A list of paths that should not be localized                                                                                                    |
| `noPrefixDefaultLocale` | Boolean | `true`  | By default, paths generated for the default language don't contain a locale prefix, set this option to `false` to disable this behavior         |
| `redirectRootToLocale`  | String  |         | Specify a locale to which the user should be redirected when visiting root URL (/), doesn't do anything if `noPrefixDefaultLocale` is enabled   |
| `seo`                   | Boolean | `true`  | Set to `false` to disable SEO metadata generation                                                                                               |

## Configuration example

Here's an example configuration for an app that supports English and French, with English as the default and fallback language and some custom routes. You'll probably want to split the configuration accross multiple files to avoid bloating `nuxt.config.js`.

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

## License

[MIT License](./LICENSE)

Copyright (c) Paul Gascou-Vaillancourt (@paulgv)
