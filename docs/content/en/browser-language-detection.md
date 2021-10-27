---
title: Browser language detection
description: "By default, **@nuxtjs/i18n** attempts to redirect users to their preferred language by detecting their browser's language. This is controlled by the `detectBrowserLanguage` option:"
position: 8
category: Guide
---

By default, **@nuxtjs/i18n** attempts to redirect users to their preferred language by detecting their browser's language. This is controlled by the `detectBrowserLanguage` option:

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    redirectOn: 'root',  // recommended
  }
}
```

<alert type="info">

For better SEO, it's recommended to set `redirectOn` to `root` (which is the default value). With it set, the language detection is only attempted when the user visits the root path (`/`) of the site. This allows crawlers to access the requested page rather than being redirected away based on detected locale. It also allows linking to pages in specific locales.

</alert>

Browser language is detected either from `navigator` when running on client-side, or from the `accept-language` HTTP header. Configured `locales` (or locales `iso` and/or `code` when locales are specified in object form) are matched against locales reported by the browser (for example `en-US,en;q=0.9,no;q=0.8`). If there is no exact match for the full locale, the language code (letters before `-`) are matched against configured locales.

To prevent redirecting users every time they visit the app, **@nuxtjs/i18n** sets a cookie after the first redirection. You can change the cookie's name by setting `detectBrowserLanguage.cookieKey` option to whatever you'd like, the default is _i18n_redirected_.

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'my_custom_cookie_name'
  }
}
```

If you'd rather have users be redirected to their browser's language every time they visit the app, disable the cookie by setting `detectBrowserLanguage.useCookie` to `false`.

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: {
    useCookie: false
  }
}
```

To completely disable the browser's language detection feature, set `detectBrowserLanguage` to `false`.

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: false
}
```

To redirect the user every time they visit the app and keep their selected choice, enable alwaysRedirect:

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    alwaysRedirect: true
  }
}
```

To use the cookie within a cross-origin environment (e.g. in an iFrame), you can set `cookieCrossOrigin: true`. This will change the cookie settings from `SameSite=Lax` to `SameSite=None; Secure`.

```js {}[nuxt.config.js]
i18n: {
  // ...
  detectBrowserLanguage: {
    useCookie: true,
    cookieCrossOrigin: true
  }
}
```
