# SEO

By default, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does:

* Add a _lang_ attribute containing current locale's ISO code to the `<html>` tag.
* Generate `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. For each language, the ISO code is used as `hreflang` attribute's value. [More on hreflang](https://support.google.com/webmasters/answer/189077)
* Generate `og:locale` and `og:locale:alternate` meta tags as defined in the [Open Graph protocol](http://ogp.me/#optional)
* When using `prefix_and_default` strategy, generate `rel="canonical"` link on the default language routes containing the 
prefix to avoid duplicate indexation. [More on canonical](https://support.google.com/webmasters/answer/182192#dup-content)


For this feature to work, you must configure `locales` option as an array of objects, where each object has an `iso` option set to the language ISO code:

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

You should also set the `baseUrl` option to your production domain in order to make alternate URLs fully-qualified:

```js
// nuxt.config.js

['nuxt-i18n', {
  baseUrl: 'https://my-nuxt-app.com'
}]
```


To disable this feature everywhere in your app, set `seo` option to `false`:

```js
// nuxt.config.js

['nuxt-i18n', {
  seo: false
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

To override SEO metadata for any page, simply declare your own `head ()` method. Have a look at [src/plugins/seo.js](/src/plugins/seo.js) if you want to copy some of **nuxt-i18n**'s logic.

## Improving performance

The default method to inject SEO metadata, while convenient, comes at a performance costs.
The `head` method is registered for every component in your app.
This means each time a component is created, the SEO metadata is recomputed for every components.

To improve performance you can use the `$nuxtI18nSeo` method in your layout instead.
It will generate i18n SEO metadata for the current context.

First you need to disable automatic SEO by setting `seo` to `false` in your configuration:

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
