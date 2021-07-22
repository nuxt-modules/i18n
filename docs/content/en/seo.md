---
title: SEO
description: "When the `$nuxtI18nHead` added to the head, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does"
position: 8
category: Guide
---

<alert type="info">

Using the `$nuxtI18nHead` requires that locales are configured as an array of objects and not strings.

</alert>

You can use the `$nuxtI18nHead` method in your layout.

It will generate i18n SEO metadata for the current context.

Then in your app layout declare the [`head` hook](https://nuxtjs.org/guides/features/meta-tags-seo) and use `$nuxtI18nHead` inside to generate i18n SEO meta information:

```js {}[layouts/default.vue]
export default {
  head () {
    return this.$nuxtI18nHead({ addSeoAttributes: true })
  }
}
```

If you have more layouts, don't forget to add it there too.

That's it!
Now SEO metadata will only be computed for the layout instead of every component in your app.


## Benefits

When the `nuxtI18nHead` added to the `head` method, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does.

### `lang` attribute for `<html>` tag

  Sets the correct `lang` attribute, equivalent to the current locale's ISO code, in the `<html>` tag.

### Automatic hreflang generation

  Generates `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. The language's ISO codes are used as `hreflang` values.

  Since version [v6.6.0](https://github.com/nuxt-community/i18n-module/releases/tag/v6.6.0), a catchall locale hreflang link is provided for each language group (e.g. `en-*`) as well. By default, it is the first language provided but another language can be selected by setting `isCatchallLocale` to `true` on that specific language object in your `nuxt.config.js`. [More on hreflang](https://support.google.com/webmasters/answer/189077)

An example without selected catchall locale:

```js {}[nuxt.config.js]
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

```js {}[nuxt.config.js]
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

```js {}[nuxt.config.js]
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

### OpenGraph Locale tag generation

Generates `og:locale` and `og:locale:alternate` meta tags as defined in the [Open Graph protocol](http://ogp.me/#optional).

### Canonical link generation

Generates `rel="canonical"` link on all pages to specify the "main" version of the page that should be indexed by search engines. This is beneficial in various situations:
  - When using the `prefix_and_default` strategy there are technically two sets of pages generated for the default locale -- one prefixed and one unprefixed. The canonical link will be set to the unprefixed version of the page to avoid duplicate indexation.
  - When the page contains the query parameters, the canonical link will **not include** query params. This is typically the right thing to do as various query params can be inserted by trackers and should not be part of the canonical link. Note that there is currently no way to override that in case that including a specific query params would be desired.

[More on canonical](https://support.google.com/webmasters/answer/182192#dup-content)

## Requirements

To leverage the SEO benefits, you must configure the `locales` option as an array of objects, where each object has an `iso` option set to the language's ISO code:

```js {}[nuxt.config.js]
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

```js {}[nuxt.config.js]
['nuxt-i18n', {
  baseUrl: 'https://my-nuxt-app.com'
}]
```

`baseUrl` can also be set to a function (that will be passed a [Nuxt Context](https://nuxtjs.org/guides/concepts/context-helpers) as a parameter) that returns a string. It can be useful to make base URL dynamic based on request headers or `window.location`.

If you'd like to enable/disable SEO for any page, simply declare your own `head ()` method. Have a look at [src/templates/head-meta.js](https://github.com/nuxt-community/i18n-module/blob/master/src/templates/head-meta.js) if you want to copy some of **nuxt-i18n**'s logic.

### Merging i18n SEO metadata with your own

If you want to add your own meta in the layout you can easily merge the object returned by `$nuxtI18nHead` with your own:

```js {}[layouts/default.vue]
export default {
  head () {
    const i18nHead = this.$nuxtI18nHead({ addSeoAttributes: true })
    return {
      htmlAttrs: {
        myAttribute: 'My Value',
        ...i18nHead.htmlAttrs
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'My Custom Description'
        },
        ...i18nHead.meta
      ],
      link: [
        {
          hid: 'apple-touch-icon',
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png'
        },
        ...i18nHead.link
     ]
    }
  }
}
```
