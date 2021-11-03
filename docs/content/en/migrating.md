---
title: Migration guide
description: Follow this guide to upgrade from one major version to the other.
position: 30
category: Guide
---

Follow this guide to upgrade from one major version to the other.

## Upgrading from `nuxt-i18n` to `nuxtjs/i18n`

Summary:

- [The name of the module changed from `nuxt-i18n` to `@nuxtjs/i18n`]()
- [`beforeLanguageSwitch` replaced by `onBeforeLanguageSwitch`](#beforelanguageswitch-replaced-by-onbeforelanguageswitch)
- [`NuxtVueI18n` typescript namespace has been removed](#nuxtvuei18n-typescript-namespace-has-been-removed)
- [`seo` option has been removed](#seo-option-has-been-removed)
- [`$nuxtI18nSeo` has been removed](#nuxti18nseo-has-been-removed)
- [`$nuxtI18nHead`'s `addDirAttribute` option default value has been changed from `true` to `false`](#nuxti18nheads-adddirattribute-option-default-value-has-been-changed-from-true-to-false)
- [`onlyOnRoot` and `onlyOnNoPrefix` options has been removed](#onlyonroot-and-onlyonnoprefix-options-has-been-removed)
- [`detectBrowserLanguage` changed to only trigger from the root path by default](#detectbrowserlanguage-changed-to-only-trigger-from-the-root-path-by-default)
- [Vuex `syncLocale` and `syncMessages` properties has been removed](#vuex-synclocale-and-syncmessages-properties-has-been-removed)

### The name of the module changed from `nuxt-i18n` to `@nuxtjs/i18n`

Uninstall the old module and install the new one:

<code-group>
  <code-block label="Yarn" active>

  ```bash
  yarn remove nuxt-i18n
  yarn add @nuxtjs/i18n
  ```

  </code-block>
  <code-block label="NPM">

  ```bash
  npm uninstall nuxt-i18n
  npm install @nuxtjs/i18n
  ```

  </code-block>
</code-group>

Change the module name in `nuxt.config.js`:

```diff
  modules: [
-    'nuxt-i18n'
+    '@nuxtjs/i18n'
  ]
```

- Update all other references to the old name that you might have in your code.

### `beforeLanguageSwitch` replaced by `onBeforeLanguageSwitch`

If you have defined the `beforeLanguageSwitch` option within your module configuration or using it through the API then you need to switch to `onBeforeLanguageSwitch`.

Example change:

```diff
-  app.i18n.beforeLanguageSwitch = (oldLocale, newLocale) => {
-    // ...
-  }
+  app.i18n.onBeforeLanguageSwitch = (oldLocale, newLocale, isInitialSetup, context) => {
+    if (!isInitialSetup) {
+      // ...
+    }
+  }
```

Note that the old hook was not called in the "initial setup" case so to preserve the old behavior, you might want to skip running the code of your hook when `isInitialSetup` is `true`.

Also check out the [onBeforeLanguageSwitch documentation](/callbacks#onbeforelanguageswitch).

### `NuxtVueI18n` typescript namespace has been removed

The module no longer defines nor exports a global `NuxtVueI18n` typescript namespace. Now all module types are exported directly and are not made available through a global namespace.

If you are using the types from the global namespace in your typescript code or in JSDoc annotations in your javascript code, you have to instead import the type explicitly from the `@nuxtjs/i18n` module.

For example, instead of:

```js
/** @type {NuxtVueI18n.LocaleObject} */
const locale = { code: 'en' }
```

do:

```js
/** @type {import('@nuxtjs/i18n').LocaleObject} */
const locale = { code: 'en' }
```

The names of the exported types have also changed in some cases so refer to the [/types/index.d.ts](https://github.com/nuxt-community/i18n-module/blob/master/types/index.d.ts) file to see the exported types.

### `seo` option has been removed

For performance reasons the module option `seo` has been removed.

The alternative is to return `$nuxtI18nHead({ addDirAttribute: true, addSeoAttributes: true })` from the `head` component option within the layout file.

See also [SEO Guide](/seo) for more details.

### `$nuxtI18nSeo` has been removed

The `$nuxtI18nSeo()` function that was used to generate meta information to be used wihtin the Nuxt's `head` component option has been removed.

If you have been using `$nuxtI18nSeo` in your code, replace it with `$nuxtI18nHead({ addSeoAttributes: true })`.

See also the [SEO Guide](/seo) and the [`$nuxtI18nHead` API documentation](/api#nuxti18nhead).

### `$nuxtI18nHead`'s `addDirAttribute` option default value has been changed from `true` to `false`

The default value of the `addDirAttribute` option that the `$nuxtI18nHead` accepts has been changed from `true` to `false`.

If you don't have the `defaultDirection` module option set nor have defined the `dir` property on your locales then you don't have to do anything. Otherwise, if you are using `$nuxtI18nHead`, then explicitly enable `addDirAttribute` with `$nuxtI18nHead({ addDirAttribute: true })`.

### `onlyOnRoot` and `onlyOnNoPrefix` options has been removed

The removed `detectBrowserLanguage.onlyOnRoot` and `detectBrowserLanguage.onlyOnNoPrefix` options are now combined into a single `detectBrowserLanguage.redirectOn` option that accepts values `'all'`, `'root'`, or `'no prefix'`.

If you have explicitly enabled the `onlyOnRoot` or the `onlyOnNoPrefix` option, switch to `redirectOn: 'root'` or `redirectOn: 'no prefix'` respectively.

Note that the default value has also changed from `all` to`root`.

See also [`detectBrowserLanguage` documentation](/options-reference#detectbrowserlanguage).

### `detectBrowserLanguage` changed to only trigger from the root path by default

Previously, with `detectBrowserLanguage` enabled, the module would attempt to detect the browser's locale regardless of the path that was visited. This is no longer the case by default - the module will only attempt to redirect when visiting the root path.

For better SEO it's recommended to keep the new behavior enabled but if you want to revert to the previous behavior then set `redirectOn: 'all'`.

See also the [Browser language detection Guide](/browser-language-detection).

### Vuex `syncLocale` and `syncMessages` properties has been removed

The `vuex` module options `syncLocale` and `syncMessages` has been removed.

It was decided that those are redundant as there is an alternative way to access them through the API:
 - the currently used locale is accessible through `$i18n.locale`
 - the currently loaded messages can be accessed through `$i18n.messages`
