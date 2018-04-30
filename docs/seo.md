# SEO

By default, **nuxt-i18n** attempts to add some metadata to improve your pages SEO. Here's what it does:

* Add a _lang_ attribute containing current locale's ISO code to the `<html>` tag.
* Generate `<link rel="alternate" hreflang="x">` tags for every language configured in `nuxt.config.js`. For each language, the ISO code is used as `hreflang` attribute's value.


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
  i18n: {
    seo: false
  }
}
```

To override SEO metadata for any page, simply declare your own `head ()` method. Have a look at [src/plugins/seo.js](/src/plugins/seo.js) if you want to copy some of **nuxt-i18n**'s logic.

