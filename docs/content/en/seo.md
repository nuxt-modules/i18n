---
title: SEO
description: "When the `$nuxtI18nHead` is added to the head, **@nuxtjs/i18n** attempts to add some metadata to improve your pages SEO. Here's what it does"
position: 8
category: Guide
---

## Introduction

**@nuxtjs/i18n** provides the `$nuxtI18nHead` function which you can use to generate SEO metadata to optimize locale-related aspects of the app for the search engines.

Here are the specific optimizations and features that it enables:
- `lang` attribute for the `<html>` tag
- `hreflang` alternate link generation
- OpenGraph locale tag generation
- canonical link generation

[Read more about those features below](#feature-details)

## Requirements

To leverage the SEO benefits, you must configure the `locales` option as an array of objects, where each object has an `iso` option set to the language's ISO code:

```js {}[nuxt.config.js]
i18n: {
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
}
```

You must also set the `baseUrl` option to your production domain in order to make alternate URLs fully-qualified:

```js {}[nuxt.config.js]
i18n: {
  baseUrl: 'https://my-nuxt-app.com'
}
```

(Note that `baseUrl` can also be set to a function. Check [`baseUrl` documentation](/options-reference#baseurl).)

## Setup

The `$nuxtI18nHead` function returns metadata that is handled by the [Vue Meta](https://github.com/nuxt/vue-meta) plugin that is integrated within Nuxt. That metadata can be specified in various places within Nuxt:
 - the `head()` option within the Nuxt configuration file (`nuxt.config.js`)
 - the `head()` component option in your **page** components or layout files

To enable SEO metadata, declare a [`head`](https://nuxtjs.org/guides/features/meta-tags-seo) function in one of the places specified above and make it return the result of a `$nuxtI18nHead` function call.

To avoid duplicating the code, it's recommended to set that option globally in your `nuxt.config.js` file and potentially override some values per-layout or per-page component, if necessary.

```js {}[nuxt.config.js]
export default {
  // ...other Nuxt options...
  head () {
    return this.$nuxtI18nHead({ addSeoAttributes: true })
  }
}
```

<alert type="warning">

Unfortunately such `head()` definition can crash during static generation (`nuxt generate`) due to Nuxt executing that function in a non-Vue Component context during generation of the `fallback` file. If this issue affects you then null-check `this.$nuxtI18nHead` before calling it.

</alert>

Check out the options you can pass to the `$nuxtI18nHead` in the [API documentation](/api#nuxti18nhead).

That's it!

If you also want to add your own metadata, you have to merge your data with the object returned by `$nuxtI18nHead`. Either as in the example below or using some library like `deepmerge` to perform a deep merge of two objects.

```js {}[nuxt.config.js]
export default {
  // ...other Nuxt options...
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

## Feature details

- `lang` attribute for the `<html>` tag

  Sets the correct `lang` attribute, equivalent to the current locale's ISO code, in the `<html>` tag.

- `hreflang` alternate link

  Generates `<link rel="alternate" hreflang="x">` tags for every configured locale. The locales' ISO codes are used as `hreflang` values.

  Since version [v6.6.0](https://github.com/nuxt-community/i18n-module/releases/tag/v6.6.0), a "catchall" locale hreflang link is provided for each locale group (e.g. `en-*`) as well. By default, it is the first locale provided, but another locale can be selected by setting `isCatchallLocale` to `true` on that specific locale object in your **@nuxtjs/i18n** configuration. [More on hreflang](https://support.google.com/webmasters/answer/189077)

  An example without selected "catchall" locale:

  ```js {}[nuxt.config.js]
  i18n: {
    locales: [
      {
        code: 'en',
        iso: 'en-US' // Will be used as "catchall" locale by default
      },
      {
        code: 'gb',
        iso: 'en-GB'
      }
    ]
  }
  ```

  Here is how you'd use `isCatchallLocale` to selected another locale:

  ```js {}[nuxt.config.js]
  i18n: {
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
  }
  ```

  In case you already have an `en` locale `iso` set, it'll be used as the "catchall" without doing anything

  ```js {}[nuxt.config.js]
  i18n: {
    locales: [
      {
        code: 'gb',
        iso: 'en-GB'
      },
      {
        code: 'en',
        iso: 'en' // will be used as "catchall" locale
      }
    ]
  }
  ```

- OpenGraph Locale tag generation

  Generates `og:locale` and `og:locale:alternate` meta tags as defined in the [Open Graph protocol](http://ogp.me/#optional).

- Canonical link

  Generates `rel="canonical"` link on all pages to specify the "main" version of the page that should be indexed by search engines. This is beneficial in various situations:
  - When using the `prefix_and_default` strategy there are technically two sets of pages generated for the default locale -- one prefixed and one unprefixed. The canonical link will be set to the unprefixed version of the page to avoid duplicate indexation.
  - When the page contains query parameters, the canonical link will **not include** the query params by default. This is typically the right thing to do as various query params can be inserted by trackers and should not be part of the canonical link. This can be overriden by using the `canonicalQueries` option. For example:

    ```js
    export default {
      head() {
        return this.$nuxtI18nHead({
          addSeoAttributes: {
            canonicalQueries: ['foo']
          }
        })
      }
    ```

  [More on canonical](https://support.google.com/webmasters/answer/182192#dup-content)
