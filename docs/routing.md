# Basic Routing

**i18n-module** overrides Nuxt default routes to add locale prefixes to every URL.  
Say your app supports two languages: French and English as the default language, and you have the following pages in your project:

```asciidoc
pages/
├── index.vue
├── about.vue
```

This would result in the following routes being generated

```js
[
  {
    path: "/",
    component: _3237362a,
    name: "index___en"
  },
  {
    path: "/fr/",
    component: _3237362a,
    name: "index___fr"
  },
  {
    path: "/about",
    component: _71a6ebb4,
    name: "about___en"
  },
  {
    path: "/fr/about",
    component: _71a6ebb4,
    name: "about___fr"
  }
]
```

Note that routes for the English version do not have any prefix because it is the default language, see next section for more details.

## Strategy

There are two supported strategies for generating the app's routes:

### prefix_except_default

Using this strategy, all of your routes will have a locale prefix added except for the default language.

### prefix

With this strategy, all the routes will have a locale prefix.

To configure the strategy, use the `strategy` option. Make sure you have a `defaultLocale` defined if using **prefix_except_default** strategy.


```js
// nuxt.config.js

{
  strategy: 'prefix_except_default',
  defaultLocale: 'en'
}
```


## Custom localized path

In some cases, you might want to translate URLs in addition to having them prefixed with the locale code. To achieve this, add a `i18n.paths` property to your page and set your custom paths there:

```js
// pages/about.vue

export default {
  i18n: {
    paths: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}
```

## Ignore routes

If you'd like some page to be available to some languages only, you can configure a list of supported languages to override global settings:


```js
// pages/about.vue

export default {
  i18n: {
    locales: ['fr', 'es']
  }
}
```

To completely disable i18n on a given page:

```js
// pages/about.vue

export default {
  i18n: false
}
```
