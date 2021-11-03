---
title: Different domains
description: "You might want to use a different domain name for each language your app supports. To achieve this:"
position: 11
category: Guide
---

You might want to use a different domain name for each language your app supports. To achieve this:

* Set `differentDomains` option to `true`
* Configure the `locales` option as an array of objects, where each object has a `domain` key whose value is the domain name you'd like to use for that locale. Optionally include a port (if non-standard) and/or a protocol. If the protocol is not provided then an attempt will be made to auto-detect it but that might not work correctly in some cases like when the pages are statically generated.
* Optionally set `detectBrowserLanguage` to `false`. When enabled (which it is by default), user can get redirected to a different domain on first visit. Set to `false` if you want to ensure that visiting given domain always shows page in the corresponding locale.

</alert>

```js {}[nuxt.config.js]
i18n: {
  locales: [
    {
      code: 'en',
      domain: 'mydomain.com'
    },
    {
      code: 'es',
      domain: 'es.mydomain.com'
    },
    {
      code: 'fr',
      domain: 'fr.mydomain.com'
    },
    {
      code: 'ru',
      domain: 'http://ru.mydomain.com'
    },
    {
      code: 'ua',
      domain: 'https://ua.mydomain.com'
    }
  ],
  differentDomains: true
  // Or enable the option in production only
  // differentDomains: (process.env.NODE_ENV === 'production')
}
```

When using different domain names, your lang switcher should use regular `<a>` tags:

```vue
<a
  v-for="locale in $i18n.locales"
  :href="switchLocalePath(locale.code)"
  :key="locale.code">
  {{ locale.code }}
</a>
```

## Runtime environment variables

Sometimes there's a need to change domains in different environments, e.g. staging and production.
As `nuxt.config.js` is used at build time it would be necessary to create different builds for different environments.

The alternative way is to keep the domains in Vuex store under `localeDomains` property. It can be accessed by the plugin
during the initialisation, saving the trouble building multiple images.

```js {}[config/locale-domains.js]
module.exports = {
  uk: process.env.DOMAIN_UK,
  fr: process.env.DOMAIN_FR,
};
```

```js {}[nuxt.config.js]
const localeDomains = require('./config/locale-domains')
//...
[
  '@nuxtjs/i18n',
  {
    differentDomains: process.env.NODE_ENV === 'production',
    locales: [
      {
        code: 'uk',
        domain: localeDomains.uk, // optional
      },
      {
        code: 'fr',
        domain: localeDomains.fr, // optional
      },
    ],
  },
]
```

```js {}[store/index.js]
const localeDomains = require('~~/config/locale-domains');

export const state = () => ({
  localeDomains,
});
```
