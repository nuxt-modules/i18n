---
title: Lazy-load translations
description: "Lazy-load translations"
position: 9
category: Guide
---

For apps that contain a lot of translated content, it is preferable not to bundle all the messages in the main bundle but rather lazy-load only the language that the users selected.
This can be achieved with **@nuxtjs/i18n** by letting the module know where your translation files are located so it can dynamically import them when the app loads or when the user switches to another language.
To enable translations lazy-loading, follow these steps when configuring **@nuxtjs/i18n**:

* Set `lazy` option to `true` (or to [configuration object](#lazy-configuration-options) if you want to customize some options).
* Set `langDir` option to the directory (can not be empty) that contains your translation files.
* Configure `locales` option as an array of object, where each object has a `file` key whose value is the translation file corresponding to the locale.
* Optionally, remove all messages that you might have passed to vue-i18n via `vueI18n` option.
* Each `file` can return either an `Object` or a `function` (supports `Promises`).

Example files structure:

```
nuxt-project/
├── lang/
│   ├── en-US.js
│   ├── es-ES.js
│   ├── fr-FR.js
├── nuxt.config.js
```

Configuration example:

```js {}[nuxt.config.js]
i18n: {
  locales: [
    {
      code: 'en',
      file: 'en-US.js'
    },
    {
      code: 'es',
      file: 'es-ES.js'
    },
    {
      code: 'fr',
      file: 'fr-FR.js'
    }
  ],
  lazy: true,
  langDir: 'lang/',
  defaultLocale: 'en'
}
```

Language file example:

```js {}[lang/en-US.js]
export default async (context, locale) => {
  return await Promise.resolve({
    welcome: 'Welcome'
  })
}

// or

export default {
  welcome: 'Welcome'
}
```

<alert type="info">

Note that if you want to use the `$axios` instance from the `@nuxtjs/axios` module within the exported function, the `@nuxtjs/axios` module must be registered **after** the `@nuxtjs/i18n` module.

This rule in fact applies also to any other module that adds plugins and whose functionality you'd want to use from within that function.

</alert>

## Lazy configuration options

The `lazy` option can be assigned a configuration object to customize the lazy-loading behavior.

The supported configuration options are:

### `skipNuxtState`

By default, the locale messages for the currently selected locale (unless it happens to be the `fallbackLocale`) are injected into the Nuxt "state" on the server-side and re-used on the client-side. The benefit of that is that the messages are available synchronously on the client-side and an extra network request is avoided. The downside is that it makes each page server response bigger (especially if there is a lot of messages). This applies both to the server-side rendered and statically-generated sites.

With `skipNuxtState` enabled, the locale messages are loaded from respective javascript bundles (for fallback locale from the main bundle and for other locales from their own bundles). This allows the payload to be smaller, but means that the page load might be slower due to an extra request (although browser-side caching will help as much as possible).
