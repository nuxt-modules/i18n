---
title: Basic Usage
description: 'The fastest way to get started with **@nuxtjs/i18n** is to define the supported `locales` list and to provide some translation messages to **vue-i18n** via the `vueI18n` option:'
position: 3
category: Getting started
---

The fastest way to get started with **@nuxtjs/i18n** is to define the supported `locales` list and to provide some translation messages to **vue-i18n** via the `vueI18n` option:

```js {}[nuxt.config.js]
{
  modules: [
    '@nuxtjs/i18n'
  ],

  i18n: {
    locales: ['en', 'fr', 'es'],
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
  }
}
```

With this setup, **@nuxtjs/i18n** generates localized URLs for all your pages, using the codes provided in the `locales` option as the prefix, except for the `defaultLocale` (read more on [routing](/routing)).

The `vueI18n` option is passed as is to **vue-i18n**, refer to the [doc](https://kazupon.github.io/vue-i18n/) for available options.

## nuxt-link

When rendering internal links in your app using `<nuxt-link>`, you need to get proper URLs for the current locale. To do this, **@nuxtjs/i18n** registers a global mixin that provides some helper functions:

* `localePath` – Returns the localized URL for a given page. The first parameter can be either the path or name of the route or an object for more complex routes. A locale code can be passed as the second parameter to generate a link for a specific language:

```vue
<nuxt-link :to="localePath('index')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('/')">{{ $t('home') }}</nuxt-link>
<nuxt-link :to="localePath('index', 'en')">Homepage in English</nuxt-link>
<nuxt-link :to="localePath('/app/profile')">Route by path to: {{ $t('Profile') }}</nuxt-link>
<nuxt-link :to="localePath('app-profile')">Route by name to: {{ $t('Profile') }}</nuxt-link>
<nuxt-link
  :to="localePath({ name: 'category-slug', params: { slug: category.slug } })">
  {{ category.title }}
</nuxt-link>
<!-- It's also allowed to omit 'name' and 'path'. -->
<nuxt-link :to="localePath({ params: { slug: 'ball' } })">{{ category.title }}</nuxt-link>
```
Note that `localePath` can use the route's unprefixed path, which must start with `'/'` or the route's base name to generate the localized URL. The base name corresponds to the names Nuxt generates when parsing your `pages/` directory, more info in [Nuxt's doc](https://nuxtjs.org/guides/features/file-system-routing).

* `switchLocalePath` – Returns a link to the current page in another language:

```vue
<nuxt-link :to="switchLocalePath('en')">English</nuxt-link>
<nuxt-link :to="switchLocalePath('fr')">Français</nuxt-link>
```

For convenience, these methods are also available in the app's context:

```js {}[/plugins/myplugin.js]
export default ({ app }) => {
  // Get localized path for homepage
  const localePath = app.localePath('index')
  // Get path to switch current route to French
  const switchLocalePath = app.switchLocalePath('fr')
}
```

* `localeRoute` – Returns the `Route` object for a given page. It works like `localePath` but returns route resolved by Vue Router rather than just a full route path. This can be useful since full path returned from `localePath` might not carry all information from provided input (for example the route params that the page doesn't specify).

```vue
const { fullPath } = localeRoute({ name: 'index', params: { foo: '1' } })
```

* `localeLocation` – Returns the `Location` object for a given page. It works like `localePath` but returns `Location` resolved by Vue Router rather than just a full route path. This can be useful since full path returned from `localePath` might not carry all information from provided input (for example route params that the page doesn't specify).

```vue
<a href="#" @click="$router.push(localeLocation({ name: 'index', params: { foo: '1' } }))">Navigate</a>
```
