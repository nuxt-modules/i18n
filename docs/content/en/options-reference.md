---
title: Options
description: 'Here are all the options available when configuring the module and their default values:'
position: 4
category: Getting started
---

See the [Setup](/setup) section on where to set the module options.

## `baseUrl`

- type: `string` or `function`
- default: `''`

The fallback base URL to use as a prefix for alternate URLs in `hreflang` tags. By default VueRouter's base URL will be used and only if that is not available, fallback URL will be used.

Can also be a function (will be passed a Nuxt Context as a parameter) that returns a string. Useful to make base URL dynamic based on request headers.

<alert type="info">

It's especially important to set this option when using SEO features, in which case it's required that generated SEO tags use fully-qualified URLs.

</alert>

## `locales`

- type: `array`
- default: `[]`

List of locales supported by your app. Can either be an array of codes (`['en', 'fr', 'es']`) or an array of objects for more complex configurations:

```js
[
  { code: 'en', iso: 'en-US', file: 'en.js', dir: 'ltr' },
  { code: 'ar', iso: 'ar-EG', file: 'ar.js', dir: 'rtl' },
  { code: 'fr', iso: 'fr-FR', file: 'fr.js' },
]
```

When using an object form, the properties can be:
- `code` (**required**) - unique identifier of the locale
- `iso` (required when using SEO features) - The ISO code used for SEO features and for matching browser locales when using [`detectBrowserLanguage`](#detectbrowserlanguage) functionality. Should be in one of those formats:
  * ISO 639-1 code (e.g. `'en'`)
  * ISO 639-1 and ISO 3166-1 alpha-2 codes, separated by hyphen (e.g. `'en-US'`)
- `file` - the name of the file. Will be resolved relative to `langDir` path when loading locale messages from file
- `dir` (from `v6.19.0`)  The dir property specifies the direction of the elements and content, value could be `'rtl'`, `'ltr'` or `'auto'`.
- `domain` (required when using [`differentDomains`](#differentdomains)) - the domain name you'd like to use for that locale (including the port if used)
- `...` - any custom property set on the object will be exposed at runtime. This can be used, for example, to define the language name for the purpose of using it in a language selector on the page.

You can access all the properties of the current locale through the `localeProperties` property. When using an array of codes, it will only include the `code` property.

<alert type="info">

For direction attribute to be set, you MUST use the `$nuxtI18nHead` method in your layout.

```js {}[layouts/default.vue]
export default {
  head () {
    return this.$nuxtI18nHead()
  }
}
```

</alert>

## `defaultDirection`

- type: `string`
- default: `ltr`

The app's default direction. Will only be used when `dir` is not specified.

## `defaultLocale`

- type: `string` or `null`
- default: `null`

The app's default locale. Should match code of one of defined `locales`.

When using `prefix_except_default` strategy, URLs for locale specified here won't have a prefix. **It's recommended to set this to some locale** regardless of chosen strategy, as it will be used as a fallback locale when navigating to a non-existent route.

## `sortRoutes`

- type: `boolean`
- default: `true`

Whether to sort routes by using the `sortRoutes` function from the `@nuxt/utils` package.

While Nuxt sorts the routes itself, it does that before **@nuxtjs/i18n** has added its own generated routes so the module has to re-sort them again. This is necessary as otherwise some routes might become inaccessible due to being shadowed by more generic routes. If you are adding custom routes programmatically, the sorting might change the order of your custom routes in unexpected ways so in that case you might want to disable sorting and handle that yourself. In that case you have to ensure the correct order yourself so that, for example, a more generic route like `/en/*` doesn't shadow a more specific `/en/foo/*` route (the latter should be registered first to work properly).

## `strategy`

- type: `string`
- default: `'prefix_except_default'`

Routes generation strategy. Can be set to one of the following:
- `'no_prefix'`: routes won't have a locale prefix
- `'prefix_except_default'`: locale prefix added for every locale except default
- `'prefix'`: locale prefix added for every locale
- `'prefix_and_default'`: locale prefix added for every locale and default

## `lazy`

- type: `boolean` or `LazyOptions`
- default: `false`

See also [Lazy-load translations](/lazy-load-translations).

Whether the translations should be lazy-loaded. If this is enabled, you MUST configure the `langDir` option, and locales must be an array of objects, each containing a `file` key.

Loading locale messages lazily means that only messages for currently used locale (and for the fallback locale, if different from current locale) will be loaded on page loading.

#### LazyOptions

The value can also be set to an object instead of the value `true` to override configuration options related to lazy loading. Supports the following optional properties:

**skipNuxtState**

- type: `boolean`
- default: `true`

Whether the translation messages for the current locale should be injected into Nuxt state and re-used on the client-side. [Read more](/lazy-load-translations#lazy-configuration-options).

## `langDir`

- type: `string` or `null`
- default: `null`

Directory that contains translation files to load. Can be used with or without lazy-loading (the `lazy` option). Use Webpack paths like `~/locales/` (with trailing slash).

## `detectBrowserLanguage`

- type: `object`
- default:
  ```js
  {
    alwaysRedirect: false,
    fallbackLocale: '',
    redirectOn: 'root',
    useCookie: true,
    cookieAge: 365,
    cookieCrossOrigin: false,
    cookieDomain: null,
    cookieKey: 'i18n_redirected',
    cookieSecure: false,
  }
  ```

Enables browser language detection to automatically redirect visitors to their preferred locale as they visit your site for the first time.

See also [Browser language detection](/browser-language-detection) for a guide.

<alert type="info">

Note that for better SEO it's recommended to set `redirectOn` to `root`.

</alert>

Supported properties:
- `alwaysRedirect` (default: `false`) - Set to always redirect to the value stored in the cookie, not just on first visit.
- `fallbackLocale` (default: `null`) - If none of the locales match the browser's locale, use this one as a fallback.
- `redirectOn` (default: `root`) - Supported options:
  - `all` - detect browser locale on all paths.
  - `root` (recommended for improved SEO) - only detect the browser locale on the root path (`/`) of the site. Only effective when using strategy other than `'no_prefix'`.
  - `no prefix` - a more permissive variant of `root` that will detect the browser locale on the root path (`/`) and also on paths that have no locale prefix (like `/foo`). Only effective when using strategy other than `'no_prefix'`.
- `useCookie` (default: `true`) - If enabled, a cookie is set once the user has been redirected to browser's preferred locale, to prevent subsequent redirections. Set to `false` to redirect every time.
- `cookieAge` (default: `365`) - Sets the max age of the cookie in days.
- `cookieKey` (default: `'i18n_redirected'`) - Cookie name.
- `cookieDomain` (default: `null`) - Set to override the default domain of the cookie. Defaults to the **host** of the site.
- `cookieCrossOrigin` (default: `false`) - When `true`, sets the flags `SameSite=None; Secure` on the cookie to allow cross-domain use of the cookie (required when app is embedded in an iframe).
- `cookieSecure` (default: `false`) - Sets the `Secure` flag for the cookie.

Set to false to disable.

## `rootRedirect`

- type: `string` or `object` or `null`
- default: `null`

Set to a path to which you want to redirect users accessing the root URL (`/`). Accepts either a string or an object with `statusCode` and `path` properties. E.g

```js
{
  statusCode: 301,
  path: 'about-us'
}
```

## `differentDomains`

- type: `boolean`
- default: `false`

Set this to `true` when using different domains for each locale. If enabled, no prefix is added to your routes and you MUST configure locales as an array of objects, each containing a `domain` key. Refer to the [Different domains](/different-domains) for more information.

## `parsePages`

- type: `boolean`
- default: `true`

Whether [custom paths](/routing#custom-paths) are extracted from page files using babel parser.

## `pages`

- type: `object`
- default: `{}`

If `parsePages` option is disabled, the module will look for custom routes in the `pages` option. Refer to the [Routing](/routing)  for usage.

## `vuex`

- type: `object` or `false`
- default: `{ moduleName: 'i18n', syncRouteParams: true }`

Registers a store module used for syncing app's i18n state. Set to `false` to disable.

Properties:
- `moduleName` (default: `'i18n'`) - The module's namespace.
- `syncRouteParams` (default: `true`) - Enables a `setRouteParams` mutation for using custom route names with dynamic routes. See more information in [Dynamic route parameters](/lang-switcher#dynamic-route-parameters)

## `vueI18n`

- type: `object` or `string`
- default: `{}`

Configuration for the `vue-i18n` library that is used internally by this module. See full documentation at http://kazupon.github.io/vue-i18n/api/#constructor-options

<alert type="info">

It's also supported to set this property to a path to a local configuration file. The file needs to export a function or plain object. If a function, it will be passed a Nuxt Context as a parameter. It's necessary to use that approach when overriding more complex types (like functions) that can't be stringified correctly.

```js {}[~/plugins/vue-i18n.js]
export default context => {
  return {
    modifiers: {
      snakeCase: (str) => str.split(' ').join('-')
    }
  }
}
```

</alert>

## `vueI18nLoader`

- type: `boolean`
- default: `false`

If true, [vue-i18n-loader](https://github.com/intlify/vue-i18n-loader) is added to Nuxt's Webpack config, allowing to define locale messages per-page using a custom `i18n` block.

## `onBeforeLanguageSwitch`

- type: `function`
- default: `(oldLocale, newLocale, isInitialSetup, context) => {}`

A listener called before the app's locale is changed. Can override the locale that is about to be set.

See [callbacks](./callbacks)

## `onLanguageSwitched`

- type: `function`
- default: `(oldLocale, newLocale) => {}`

A listener called after app's locale has changed.

See [callbacks](./callbacks)

## `skipSettingLocaleOnNavigate`

- type: `boolean`
- default: `false`

If `true`, the locale will not be set when navigating to a new locale. This is useful if you want to wait for the page transition to end before setting the locale yourself using [`finalizePendingLocaleChange`](./api#finalizependinglocalechange). See more information in [Wait for page transition](./lang-switcher#wait-for-page-transition).

## `defaultLocaleRouteNameSuffix`

- type: `string`
- default: `'default'`

Internal suffix added to generated route names for default locale, if strategy is `prefix_and_default`. You shouldn't need to change this.

## `routesNameSeparator`

- type: `string`
- default: `'___'`

Internal separator used for generated route names for each locale. You shouldn't need to change this.
