---
title: Custom route paths
description: "Customize the names of the paths for specific locale."
position: 7
category: Guide
---

In some cases, you might want to translate URLs in addition to having them prefixed with the locale code. There are 2 ways of configuring custom paths for your pages: [in-component options](#in-component-options) or via the [module's configuration](#modules-configuration).

<alert type="warning">

Custom paths are not supported when using the `no-prefix` [strategy](/strategies).

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
i18n: {
  parsePages: false,   // Disable babel parsing
  pages: {
    about: {
      en: '/about-us', // -> accessible at /about-us (no prefix since it's the default locale)
      fr: '/a-propos', // -> accessible at /fr/a-propos
      es: '/sobre'     // -> accessible at /es/sobre
    }
  }
}
```

Note that each key within the `pages` object should correspond to the relative file path of the route within your `pages/` directory excluding the leading `/`.

Customized route paths must start with a `/` and not include the locale prefix.

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
i18n: {
  parsePages: false,
  pages: {
    '_nested/_route/index': {
      en: '/mycustompath/:nested/:route?' // Params need to be put back here as you would with vue-router
    },
    '_nested/_route/_': {
      en: '/mycustompath/:nested/*' // * will match the entire route path after /:nested/
    }
  }
}
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
i18n: {
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
}
```

If a custom path is missing for one of the locales, the `defaultLocale` custom path is used, if set.
