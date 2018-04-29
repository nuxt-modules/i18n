# Browser language detection

By default, **i18n-module** attempts to redirect users to their preferred language by detecting their browser's language. This is controlled by the `detectBrowserLanguage` option:


```js
// nuxt.config.js

['@nuxtjs/i18n', {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected'
  }
}]
```

To prevent redirecting users every time they visit the app, **i18n-module** sets a cookie after the first redirection. You can change the cookie's name by setting `detectBrowserLanguage.cookieKey` option to whatever you'd like, the default is _i18n_redirected_.

```js
// nuxt.config.js

['@nuxtjs/i18n', {
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'my_custom_cookie_name'
  }
}]
```

If you'd rather have users be redirected to their browser's language every time they visit the app, disable the cookie by setting `detectBrowserLanguage.useCookie` to `false`.

```js
// nuxt.config.js

['@nuxtjs/i18n', {
  detectBrowserLanguage: {
    useCookie: false
  }
}]
```

To completely disable de browser's language detection feature, set `detectBrowserLanguage` to `false`.

```js
// nuxt.config.js

['@nuxtjs/i18n', {
  detectBrowserLanguage: false
}]
```
