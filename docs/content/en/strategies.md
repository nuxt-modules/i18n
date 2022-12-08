---
title: Strategies
description: "Supported routing strategies."
position: 6
category: Guide
---

There are four supported strategies that affect how [app's routes](/routing) are generated:

### no_prefix

With this strategy, your routes won't have a locale prefix added. The locale will be detected & changed without changing the URL. This implies that you have to rely on browser & cookie detection, and implement locale switches by calling the i18n API.

<alert type="warning">

This strategy doesn't support [Custom paths](/custom-paths) and [Ignore routes](/ignoring-localized-routes) features.

</alert>

### prefix_except_default

Using this strategy, all of your routes will have a locale prefix added except for the default language.

### prefix

With this strategy, all routes will have a locale prefix.

### prefix_and_default

This strategy combines both previous strategies behaviours, meaning that you will get URLs with prefixes for every language, but URLs for the default language will also have a non-prefixed version (though the prefixed version will be preferred when `detectBrowserLanguage` is enabled).

### Configuration

To configure the strategy, use the `strategy` option.
Make sure that you have a `defaultLocale` defined, especially if using `prefix_except_default`, `prefix_and_default` or `no_prefix` strategy. For other strategies it's also recommended to set it as it's gonna be used as a fallback when attempting to redirect from 404 page.

```js {}[nuxt.config.js]
i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'en'
}
```

<alert type="warning">

If on `Nuxt` version lower than 2.10.2, and using strategy `prefix_except_default` or `prefix_and_default`, make sure that that the locale matching `defaultLocale` is last in the array of locales. For example:

```js {}[nuxt.config.js]
i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'en',
  locales: [
    'fr',
    'en',  // Make sure that default locale is the last one!
  ]
}
```

</alert>
