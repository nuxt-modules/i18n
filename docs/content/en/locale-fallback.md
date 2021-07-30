---
title: Locale fallback
description: "How a fallback gets selected when a translation is missing"
position: 12
category: Guide
---

**@nuxtjs/i18n** takes advantage of **vue-i18n** ability to handle localization fallback. It is possible to define a single fallback locale, an array of locales,
or a decision map for more specific needs.

```js [nuxt.config.js]
modules: [
  '@nuxtjs/i18n'
],

i18n: {
    vueI18n: {
        fallbackLocale: 'en',
        // or
        fallbackLocale: ['en', 'fr'],
        // or
        fallbackLocale: {
            'de-CH':   ['fr', 'it'],
            'zh-Hant': ['zh-Hans'],
            'es-CL':   ['es-AR'],
            'es':      ['en-GB'],
            'pt':      ['es-AR'],
            'default': ['en', 'da']
        }
    }
}
```

More information in [vue-i18n documentation](https://kazupon.github.io/vue-i18n/guide/fallback.html).
