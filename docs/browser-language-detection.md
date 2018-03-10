# Browser language detection

If you'd like your user's to be automatically redirected to their favorite language, based on the browser's settings, set the `detectBrowserLanguage` option to `true`.

By default, users will only be redirected once if they attempt to access the app in a language that differs from their browser's language. To prevent subsequent redirections, **nuxt-i18n** sets a cookie which name can be set via the `redirectCookieKey` option \(defaults to `'redirected'`\).

Would you prefer to keep redirecting returning visitors, the cookie feature can be disabled by setting `useRedirectCookie` option to `false`.

```js
{
  detectBrowserLanguage: true,
  redirectCookieKey: 'redirected',
  useRedirectCookie: true
}
```



