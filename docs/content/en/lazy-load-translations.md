---
title: Lazy-load translations
description: "Lazy-load translations"
position: 9
category: Guide
---

For apps that contain a lot of translated content, it is preferable not to bundle all the messages in the main bundle but rather lazy-load only the language that the users selected.
This can be achieved with **nuxt-i18n** by letting the module know where your translation files are located so it can dynamically import them when the app loads or when the user switches to another language.
To enable translations lazy-loading, follow these steps when configuring **nuxt-i18n**:

* Set `lazy` option to `true` or `{ skipNuxtState: true }`. [Read more](#skipnuxtstate).
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
['nuxt-i18n', {
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
}]
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

Note that if you want to use the `$axios` instance from the `@nuxtjs/axios` module within the exported function, the `@nuxtjs/axios` module must be registered **after** the `nuxt-i18n` module.

This rule in fact applies also to any other module that adds plugins and whose functionality you'd want to use from within that function.

</alert>

## `skipNuxtState`
<badge>v6.3.0+</badge>

In the case of statically generated sites if the option `lazy` is set to `true` the translation messages for the `fallbackLocale` (or `defaultLocale` if no fallback is present) are injected into the Nuxt state. This results in them being included and repeated in the HTML of each generated page. Since each page is unique the same translations are loaded over and over again.

With `{ skipNuxtState: true }` enabled the fallback locale messages are loaded from the main bundle, which is unique per application. This allows to take advantage of browser side caching.
