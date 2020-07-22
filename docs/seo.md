# SEO

## Benefits

When the `seo` option is enabled, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does.

- ### `lang` attribute for `<html>` tag

  Sets the correct `lang` attribute, equivalent to the current locale's ISO code, in the `<html>` tag.

- ### Automatic hreflang generation

  Generates `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. The language's ISO codes are used as `hreflang` values.


  Since version [v6.6.0](https://github.com/nuxt-community/i18n-module/releases/tag/v6.6.0), a catchall locale hreflang link is provided for each language group (e.g. `en-*`) as well. By default, it is the first language provided but another language can be selected by setting `isCatchallLocale` to `true` on that specific language object in your `nuxt.config.js`. [More on hreflang](https://support.google.com/webmasters/answer/189077)

An example without selected catchall locale:

```js
// nuxt.config.js

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US' // Will be used as catchall locale by default
    },
    {
      code: 'gb',
      iso: 'en-GB'
    }
  ]
}]
```

Here is how you'd use `isCatchallLocale` to selected another language:

```js
// nuxt.config.js

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US'
    },
    {
      code: 'gb',
      iso: 'en-GB',
      isCatchallLocale: true // This one will be used as catchall locale
    }
  ]
}]
```

  In case you already have an `en` language iso set, it'll be used as the catchall without doing anything

```js
// nuxt.config.js

['nuxt-i18n', {
  locales: [
    {
      code: 'gb',
      iso: 'en-GB'
    },
    {
      code: 'en',
      iso: 'en' // will be used as catchall locale
    }
  ]
}]
```

- ### OpenGraph Locale tag generation

  Generates `og:locale` and `og:locale:alternate` meta tags as defined in the [Open Graph protocol](http://ogp.me/#optional).

- ### Canonical links for `prefix_and_default`

  When using the `prefix_and_default` strategy, `rel="canonical"` links on the default language routes will be generated and contain the prefix to avoid duplicate indexation. [More on canonical](https://support.google.com/webmasters/answer/182192#dup-content)

## Requirements

To leverage the SEO benefits, you must configure the `locales` option as an array of objects, where each object has an `iso` option set to the language's ISO code:

```js
// nuxt.config.js

['nuxt-i18n', {
  locales: [
    {
      code: 'en',
      iso: 'en-US'
    },
    {
      code: 'es',
      iso: 'es-ES'
    },
    {
      code: 'fr',
      iso: 'fr-FR'
    }
  ]
}]
```

You must also set the `baseUrl` option to your production domain in order to make alternate URLs fully-qualified:

```js
// nuxt.config.js

['nuxt-i18n', {
  baseUrl: 'https://my-nuxt-app.com'
}]
```

`baseUrl` can also be set to a function (that will be passed a [Nuxt Context](https://nuxtjs.org/api/context) as a parameter) that returns a string. It can be useful to make base URL dynamic based on request headers or `window.location`.

To enable this feature everywhere in your app, set `seo` option to `true`. 
**This comes with a performance drawback though**. More information below.

```js
// nuxt.config.js

['nuxt-i18n', {
  seo: true
}]
```

If you'd like to disable SEO on specific pages, set `i18n.seo` to `false` right in the page:

```js
// pages/about.vue

export default {
  nuxtI18n: {
    seo: false
  }
}
```

To override SEO metadata for any page, simply declare your own `head ()` method. Have a look at [src/templates/seo-head.js](https://github.com/nuxt-community/i18n-module/blob/master/src/templates/seo-head.js) if you want to copy some of **nuxt-i18n**'s logic.

## Improving performance

The default method to inject SEO metadata, while convenient, comes at a performance costs.
The `head` method is registered for every component in your app.
This means each time a component is created, the SEO metadata is recomputed for every components.

To improve performance you can use the `$nuxtI18nSeo` method in your layout instead.
It will generate i18n SEO metadata for the current context.

First make sure automatic SEO is disabled by setting `seo` to `false` in your configuration or removing that option completely:

```js
// nuxt.config.js

['nuxt-i18n', {
  seo: false
}]
```

Then in your app layout declare the [`head` hook](https://nuxtjs.org/api/pages-head#the-head-method) and use `$nuxtI18nSeo` inside to generate i18n SEO meta information:

```js
// layouts/default.vue

export default {
  head () {
    return this.$nuxtI18nSeo()
  }
}
```

If you have more layouts, don't forget to add it there too.

That's it!
Now SEO metadata will only be computed for the layout instead of every component in your app.

### Merging i18n SEO metadata with your own

If you want to add your own meta in the layout you can easily merge the object returned by `$nuxtI18nSeo` with your own:

```js
// layouts/default.vue

export default {
  head () {
    const i18nSeo = this.$nuxtI18nSeo()
    return {
      htmlAttrs: {
        myAttribute: 'My Value',
        ...i18nSeo.htmlAttrs
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'My Custom Description'
        },
        ...i18nSeo.meta
      ],
      link: [
        {
          hid: 'apple-touch-icon',
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png'
        },
        ...i18nSeo.link
     ]
    }
  }
}
```
