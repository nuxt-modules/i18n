# Migration guide

Follow this guide to upgrade from one major version to the other.

## Upgrading from 3.x to 4.x

### In-component options key

v4.x introduces a single change that requires you to rename the `i18n` key to `nuxtI18n` in your pages that use in-component configuration, this should prevent conflicts with vue-i18n.

**3.x:**

```js
// pages/about.vue

export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

**4.x:**

```js
// pages/about.vue

export default {
  nuxtI18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

## Upgrading from 2.x to 3.x

### Custom routes

The `routes` option has been dropped in favor of in-component configuration, any custom path configuration should be placed in their corresponding page file.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      routes: {
        about: {
          fr: '/a-propos',
          en: '/about-us'
        }
      }
    }]
  ]
}
```

**3.x:**

```js
// pages/about.vue

export default {
  i18n: {
    paths: {
      fr: '/a-propos',
      en: '/about-us'
    }
  }
}
```

### Ignored paths


The `ignorePaths` option has been dropped as well, its behaviour can be reproduces by setting `i18n` to `false` right in your pages.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      ignorePaths: [
        '/fr/notlocalized'
      ]
    }]
  ]
}
```

**3.x:**

```js
// pages/fr/notlocalized.vue

export default {
  i18n: false
}
```

### noPrefixDefaultLocale

The `noPrefixDefaultLocale` has been dropped in favor of `strategy` option.


**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      noPrefixDefaultLocale: false
    }]
  ]
}
```

**3.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      strategy: 'prefix'
    }]
  ]
}
```

### loadLanguagesAsync

`loadLanguagesAsync` option has been renamed to `lazy`. `langFile` option in `locales` has been renamed to `file`.

### redirectCookieKey & useRedirectCookie

`redirectCookieKey` and `useRedirectCookie` have been merged into `detectBrowserLanguage` option and renamed to `cookieKey` and `useCookie` respectively.

**2.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: true,
      redirectCookieKey: 'redirected',
      useRedirectCookie: true
    }]
  ]
}
```

**3.x:**

```js
// nuxt.config.js

{
  modules: [
    ['nuxt-i18n', {
      detectBrowserLanguage: {
        cookieKey: 'redirected',
        useCookie: true
      }
    }]
  ]
}
```
