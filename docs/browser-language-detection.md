# Browser language detection

By default, **nuxt-i18n** attempts to redirect users to their preferred language by detecting their browser's language. This is controlled by the `detectBrowserLanguage` option:

```js
// nuxt.config.js

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected'
  }
}]
```

::: tip
Browser language is detected either from `navigator` when running on client side, or from the `accept-language` HTTP header. Configured `locales` (or locales `code`s when locales are specified in object form) are matched against locales reported by the browser (for example `en-US,en;q=0.9,no;q=0.8`). If there is no exact match, the language code (letters before `-`) are matched against configured locales (for backwards compatibility).
:::

To prevent redirecting users every time they visit the app, **nuxt-i18n** sets a cookie after the first redirection. You can change the cookie's name by setting `detectBrowserLanguage.cookieKey` option to whatever you'd like, the default is _i18n_redirected_.

```js
// nuxt.config.js

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'my_custom_cookie_name'
  }
}]
```

If you'd rather have users be redirected to their browser's language every time they visit the app, disable the cookie by setting `detectBrowserLanguage.useCookie` to `false`.

```js
// nuxt.config.js

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: false
  }
}]
```

To completely disable the browser's language detection feature, set `detectBrowserLanguage` to `false`.

```js
// nuxt.config.js

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: false
}]
```

To redirect the user every time they visit the app and keep their selected choice, enable alwaysRedirect:

```js
// nuxt.config.js

['nuxt-i18n', {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    alwaysRedirect: true
  }
}]
```
