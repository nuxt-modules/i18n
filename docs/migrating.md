# Migrating from 2.x

There are a few breaking changes that should be taken into consideration when migrating from 2.x to 3.x, the first one being that the npm package has been renamed to `@nuxtjs/i18n` instead of `nuxt-i18n`, make sure you update your `package.json` and your Nuxt config accordingly:

```sh
yarn remove nuxt-i18n
yarn add @nuxtjs/i18n
```

```js
// nuxt.config.js

{
  modules: [
    ['@nuxtjs/i18n', {
      // options
    }]
  ]
}
```


## Custom routes

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

```vue
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

## Ignored paths


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

```vue
// pages/fr/notlocalized.vue

export default {
  i18n: false
}
```

## noPrefixDefaultLocale

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
    ['@nuxtjs/i18n', {
      strategy: 'prefix'
    }]
  ]
}
```

## loadLanguagesAsync

`loadLanguagesAsync` option has been renamed to `lazy`.

## redirectCookieKey & useRedirectCookie

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
    ['@nuxtjs/i18n', {
      detectBrowserLanguage: {
        cookieKey: 'redirected',
        useCookie: true
      }
    }]
  ]
}
```
