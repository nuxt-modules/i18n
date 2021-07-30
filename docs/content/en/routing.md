---
title: Routing
description: "**@nuxtjs/i18n** overrides Nuxt default routes to add locale prefixes to every URL (except in no_prefix strategy)."
position: 6
category: Guide
---

**@nuxtjs/i18n** overrides Nuxt default routes to add locale prefixes to every URL (except in no_prefix strategy).
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

There are four supported strategies for generating the app's routes:

### no_prefix

With this strategy, your routes won't have a locale prefix added. The locale will be detected & changed without changing the URL. This implies that you have to rely on browser & cookie detection, and implement locale switches by calling the i18n API.

<alert type="warning">

This strategy doesn't support [Custom paths](#custom-paths) and [Ignore routes](#ignore-routes) features.

</alert>

### prefix_except_default

Using this strategy, all of your routes will have a locale prefix added except for the default language.

### prefix

With this strategy, all routes will have a locale prefix.

### prefix_and_default

This strategy combines both previous strategies behaviours, meaning that you will get URLs with prefixes for every language, but URLs for the default language will also have a non-prefixed version.

### Configuration

To configure the strategy, use the `strategy` option.
Make sure that you have a `defaultLocale` defined, especially if using **prefix_except_default**, **prefix_and_default** or **no_prefix** strategy. For other strategies it's also recommended to set it as it's gonna be used as a fallback when attempting to redirect from 404 page.

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  strategy: 'prefix_except_default',
  defaultLocale: 'en'
}]
```

<alert type="warning">

If on `Nuxt` version lower than 2.10.2, and using strategy `prefix_except_default` or `prefix_and_default`, make sure that that the locale matching `defaultLocale` is last in the array of locales. For example:

</alert>

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  strategy: 'prefix_except_default',
  defaultLocale: 'en',
  locales: [
    'fr',
    'en',  // Make sure that default locale is the last one!
  ]
}]
```

## Custom paths

In some cases, you might want to translate URLs in addition to having them prefixed with the locale code. There are 2 ways of configuring custom paths for your pages: in-component options or via the module's configuration.

<alert type="warning">

Custom paths are not supported with the `no-prefix` [strategy](#strategy).

</alert>

### In-component options

Add a `nuxtI18n.paths` property to your page and set your custom paths there:

```js {}[pages/about.vue]
export default {
  nuxtI18n: {
    paths: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}
```

To configure a custom path for a dynamic route, you need to put the params in the URI similarly to how you would do it in vue-router.

```js {}[pages/articles/_name.vue]
export default {
  nuxtI18n: {
    paths: {
      en: '/articles/:name',
      es: '/artículo/:name'
    }
  }
}
```

### Module's configuration

Make sure you set the `parsePages` option to `false` to disable babel parsing and add your custom paths in the `pages` option:

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  parsePages: false,   // Disable babel parsing
  pages: {
    about: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}]
```

Note that each key in the `pages` object should correspond to the full file path in your `pages/` directory.

Make sure all keys:
  1. Are relative to the `pages/` directory and don't start with a `/`
  2. Point directly to their corresponding file without `.vue` (make sure you add `/index` when translating root paths)

Localized routes are full URIs, so keep in mind that:
  1. They need to start with a `/`
  2. You must repeat the full URI for each child route

#### Example 1

Say you have some nested pages like:

```asciidoc
pages/
├── _nested/
├──── _route/
├────── index.vue
├────── _.vue
```

Here's how you would configure these particular pages in the configuration:

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  parsePages: false,
  pages: {
    '_nested/_route/index': {
      en: '/mycustompath/:nested/:route?' // Params need to be put back here as you would with vue-router
    },
    '_nested/_route/_': {
      en: '/mycustompath/:nested/*' // * will match the entire route path after /:nested/
    }
  }
}]
```

#### Example 2

With the following `pages` directory:

```asciidoc
pages/
├── about.vue
├── services/
├──── index.vue
├──── development/
├────── index.vue
├────── app/
├──────── index.vue
├────── website/
├──────── index.vue
├──── coaching/
├────── index.vue
```

You would need to set up your `pages` property as follows:

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  parsePages: false,
  pages: {
    about: {
      en: '/about',
      fr: '/a-propos',
    },
    'services/index': {
      en: '/services',
      fr: '/offres',
    },
    'services/development/index': {
      en: '/services/development',
      fr: '/offres/developement',
    },
    'services/development/app/index': {
      en: '/services/development/app',
      fr: '/offres/developement/app',
    },
    'services/development/website/index': {
      en: '/services/development/website',
      fr: '/offres/developement/site-web',
    },
    'services/coaching/index': {
      en: '/services/coaching',
      fr: '/offres/formation',
    }
  }
}]
```

If a custom path is missing for one of the locales, the `defaultLocale` custom path is used, if set.


## Ignore routes

<alert type="warning">

This feature is not supported with the `no-prefix` [strategy](#strategy).

</alert>

### In-component options

If you'd like some page to be available to some languages only, you can configure a list of supported languages to override global settings:

```js {}[pages/about.vue]
export default {
  nuxtI18n: {
    locales: ['fr', 'es']
  }
}
```

To completely disable i18n on a given page:

```js {}[pages/about.vue]
export default {
  nuxtI18n: false
}
```

### Module's configuration

If you disabled `parsePages` option, localization can be disabled for specific pages and locales by setting the unwanted locale(s) to `false` in the module's configuration:

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  parsePages: false,
  pages: {
    about: {
      en: false,
    }
  }
}]
```

To completely disable routes localization on a given page:

```js {}[nuxt.config.js]
['@nuxtjs/i18n', {
  parsePages: false,
  pages: {
    about: false
  }
}]
```
