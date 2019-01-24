# Routing

**nuxt-i18n** overrides Nuxt default routes to add locale prefixes to every URL.  
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

With this strategy, all routes will have a locale prefix.

### prefix_and_default

This strategy combines both previous strategies behaviours, meaning that you will get URLs with prefixes for every language, but URLs for the default language will also have a non-prefixed version.

To configure the strategy, use the `strategy` option. Make sure you have a `defaultLocale` defined if using **prefix_except_default**  or **prefix_and_default** strategy.


```js
// nuxt.config.js

['nuxt-i18n', {
  strategy: 'prefix_except_default',
  defaultLocale: 'en'
}]
```


## Custom paths

In some cases, you might want to translate URLs in addition to having them prefixed with the locale code. There are 2 ways of configuring custom paths for your pages: in-component options or via the module's configuration.

> When using in-component paths options, your pages are parsed using [acorn](https://github.com/acornjs/acorn) which might fail if you're using TypeScript or advanced syntax that might not be recognized by the parser, in which case it is recommended you set your custom paths in the module's configuration instead.

### In-component options

Add a `i18n.paths` property to your page and set your custom paths there:

```js
// pages/about.vue

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

### Module's configuration

Make sure you set the `parsePages` option to `false` to disable acorn parsing and add your custom paths in the `pages` option:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,   // Disable acorn parsing
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

Say you have some nested page like:

```asciidoc
pages/
├── _nested/
├──── _route/
├────── index.vue
```

Here's how you would configure this particular page in the configuration:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    '_nested/_route/index': {
      en: '/mycustompath/:nested/:route?' // Params need to be put back here as you would with vue-router
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

```js
// nuxt.config.js

['nuxt-i18n', {
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

### Regular Expression

By default, all custom paths are encoded to handle non-latin characters in the path. This will convert paths with regular expression like `/foo/:slug-:id(\\d+)` to `/foo/:slug-:id(%5Cd+)`.

If you would like to use regular expression in your custom paths, then you need to set the `encodePaths` option to false. Since no encoding will happen, you will have to make sure to pass in encoded paths yourself.

```js
// nuxt.config.js

['nuxt-i18n', {
  encodePaths: false
}]
```


## Ignore routes


### In-component options

If you'd like some page to be available to some languages only, you can configure a list of supported languages to override global settings:

```js
// pages/about.vue

export default {
  nuxtI18n: {
    locales: ['fr', 'es']
  }
}
```

To completely disable i18n on a given page:

```js
// pages/about.vue

export default {
  nuxtI18n: false
}
```

### Module's configuration

If you disabled `parsePages` option, localization can be disabled for specific pages and locales by setting the unwanted locale(s) to `false` in the module's configuration:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    about: {
      en: false,
    }
  }
}]
```

To completely disable routes localization on a given page:

```js
// nuxt.config.js

['nuxt-i18n', {
  parsePages: false,
  pages: {
    about: false
  }
}]
```
